import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Pool } from 'pg'; 
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  // Keep a reference to the pool so we can close it safely on exit
  private pool: Pool;

  constructor() {
    // 2. Initialize the raw pg Pool
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    // 3. Pass the pool into the PrismaPg adapter
    const adapter = new PrismaPg(pool);

    // 4. Pass the adapter to the PrismaClient constructor
    super({
      adapter,
    });

    this.pool = pool;
  }

  async onModuleInit() {
    try {
      // 🚨 HARD CHECK: Force connection on startup
      await this.$connect();
      this.logger.log('✅ Connected to Database via pg adapter');
    } catch (error) {
      this.logger.error('❌ Failed to connect to Database', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    // Disconnect Prisma
    await this.$disconnect();
    // Safely drain the pg pool
    await this.pool.end();
    this.logger.log('🛑 Disconnected from Database');
  }
}
