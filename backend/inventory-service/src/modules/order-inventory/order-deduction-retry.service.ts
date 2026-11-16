import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PrismaService } from '../../lib/prisma/prisma.service.js';
import {
  isOrderCompleteEvent,
  type OrderCompleteEvent,
} from './events/order-complete.event.js';
import {
  InsufficientRestaurantStockError,
  OrderInventoryService,
} from './order-inventory.service.js';

@Injectable()
export class OrderDeductionRetryService {
  private readonly logger = new Logger(OrderDeductionRetryService.name);
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: OrderInventoryService,
  ) {}

  async processOrDefer(
    event: OrderCompleteEvent,
    source: { topic: string; partition: number; offset: string },
  ) {
    try {
      await this.inventory.processOrderComplete(event);
    } catch (error) {
      if (
        !(error instanceof InsufficientRestaurantStockError) &&
        !(error instanceof NotFoundException) &&
        !(error instanceof BadRequestException) &&
        !(error instanceof BadGatewayException) &&
        !(error instanceof UnauthorizedException)
      ) {
        throw error;
      }

      await this.prisma.$transaction(async (tx) => {
        const payload = {
          ...event,
          modifiers: (event.modifiers ?? []).map((item) => ({ ...item })),
        };
        const saved = await tx.inventoryPendingDeduction.createMany({
          data: {
            orderItemId: event.orderItemId,
            payload,
            lastError: error.message,
            retryAt: new Date(Date.now() + 30_000),
          },
          skipDuplicates: true,
        });

        if (saved.count && error instanceof InsufficientRestaurantStockError) {
          await tx.inventoryOutbox.create({
            data: {
              topic: 'order-complete-stock-shortage',
              payload: {
                event: payload,
                source,
                ingredientId: error.ingredientId,
                requiredQuantity: error.requiredQuantity,
              },
            },
          });
        }
      });
    }
  }

  @Interval(5000)
  async retryPending() {
    if (this.running) return;
    this.running = true;
    try {
      const pending = await this.prisma.inventoryPendingDeduction.findMany({
        where: { retryAt: { lte: new Date() } },
        orderBy: [{ retryAt: 'asc' }, { orderItemId: 'asc' }],
        take: 25,
      });
      for (const deduction of pending) {
        if (!isOrderCompleteEvent(deduction.payload)) {
          this.logger.error(
            'Invalid persisted deduction for item ' + deduction.orderItemId,
          );
          await this.reschedule(deduction, 'Invalid stored event');
          continue;
        }
        try {
          await this.inventory.processOrderComplete(deduction.payload);
          await this.prisma.inventoryPendingDeduction.deleteMany({
            where: { orderItemId: deduction.orderItemId },
          });
        } catch (error) {
          await this.reschedule(
            deduction,
            error instanceof Error ? error.message : 'Deduction failed',
          );
        }
      }
    } catch (error) {
      this.logger.warn('Unable to retry Inventory deductions.', error);
    } finally {
      this.running = false;
    }
  }

  private async reschedule(
    deduction: { orderItemId: string; attempts: number },
    lastError: string,
  ) {
    const delay = Math.min(
      30_000 * 2 ** Math.min(deduction.attempts, 5),
      900_000,
    );
    await this.prisma.inventoryPendingDeduction.updateMany({
      where: {
        orderItemId: deduction.orderItemId,
        attempts: deduction.attempts,
      },
      data: {
        attempts: { increment: 1 },
        retryAt: new Date(Date.now() + delay),
        lastError,
      },
    });
  }
}
