import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../lib/prisma/prisma.service.js';
import { CatalogGatewayService } from '../../utils/caltalog-gateway.service.js';

@Injectable()
export class InventorySchedulerService {
  private readonly logger = new Logger(InventorySchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly catalogGateway: CatalogGatewayService,
  ) {}

  // Runs every day at 08:00, 14:00 and 20:00
  @Cron('0 8,14,20 * * *')
  async checkLowStock() {
    this.logger.log('Starting low-stock check');

    try {
      const lowStockItems = await this.prisma.$queryRaw<
        Array<{
          id: string;
          restaurantId: string;
          ingredientId: string;
          quantityOnHand: unknown;
          reorderLevel: unknown;
          reorderQuantity: unknown;
        }>
      >`
      SELECT
        "id",
        "restaurantId",
        "ingredientId",
        "quantityOnHand",
        "reorderLevel",
        "reorderQuantity"
      FROM "RestaurantStock"
      WHERE "quantityOnHand" <= "reorderLevel"
        AND "reorderQuantity" > 0
      ORDER BY "restaurantId", "quantityOnHand" ASC
    `;

      if (lowStockItems.length === 0) {
        this.logger.log('No low-stock ingredients found');
        return;
      }

      // --------------------------------------------------
      // GET ALL INGREDIENT DETAILS IN ONE CATALOG CALL
      // --------------------------------------------------

      const ingredientIds = [
        ...new Set(lowStockItems.map((item) => item.ingredientId)),
      ];

      const ingredients =
        await this.catalogGateway.getBulkIngredients(ingredientIds);

      const ingredientMap = new Map(
        ingredients.map((ingredient) => [ingredient.id, ingredient]),
      );

      // --------------------------------------------------
      // GROUP LOW-STOCK ITEMS BY RESTAURANT
      // --------------------------------------------------

      const restaurantMap = new Map<
        string,
        Array<{
          stockId: string;
          ingredientId: string;
          ingredient: {
            id: string;
            name: string;
            uom: string;
          } | null;
        }>
      >();

      for (const item of lowStockItems) {
        const existing = restaurantMap.get(item.restaurantId) ?? [];

        existing.push({
          stockId: item.id,
          ingredientId: item.ingredientId,

          ingredient: ingredientMap.get(item.ingredientId)
            ? {
                id: ingredientMap.get(item.ingredientId)!.id,
                name: ingredientMap.get(item.ingredientId)!.name,
                uom: ingredientMap.get(item.ingredientId)!.uom,
              }
            : null,
        });

        restaurantMap.set(item.restaurantId, existing);
      }

      // --------------------------------------------------
      // Persist the complete batch before the outbox worker contacts Kafka.
      // --------------------------------------------------

      await this.prisma.inventoryOutbox.createMany({
        data: [...restaurantMap].map(([restaurantId, items]) => ({
          topic: 'inventory.low-stock',
          payload: { restaurantId, items },
        })),
      });

      this.logger.log(
        `Queued low-stock events for ${restaurantMap.size} restaurants`,
      );
    } catch (error) {
      this.logger.error('Low-stock check failed', error);
    }
  }
}
