import {
  Controller,
  Get,
  Header,
  ServiceUnavailableException,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { InventoryAccess } from './auth/inventory-access.js';
import { PrismaService } from './lib/prisma/prisma.service.js';

@InventoryAccess('health')
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  private pendingRead?: Promise<unknown>;

  constructor(private readonly prisma: PrismaService) {}

  @Get('live')
  @Header('Cache-Control', 'no-store')
  live() {
    return { status: 'ok' };
  }

  @Get('ready')
  @Header('Cache-Control', 'no-store')
  async ready() {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      // Coalesce slow probes so a disconnected database cannot accumulate queries.
      this.pendingRead ??= Promise.resolve(
        this.prisma.$queryRaw`SELECT 1`,
      ).finally(() => {
        this.pendingRead = undefined;
      });
      await Promise.race([
        this.pendingRead,
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error('Readiness timeout')),
            2000,
          );
        }),
      ]);
      return { status: 'ready' };
    } catch {
      throw new ServiceUnavailableException('Database is unavailable');
    } finally {
      clearTimeout(timer);
    }
  }
}
