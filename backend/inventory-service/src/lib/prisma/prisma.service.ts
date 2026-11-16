import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Pool } from 'pg'; // <-- 1. Import Pool from 'pg'
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

class SequentialPrismaPg extends PrismaPg {
  override async connect() {
    const adapter = await super.connect();
    const startTransaction = adapter.startTransaction.bind(adapter);

    adapter.startTransaction = async (isolationLevel) => {
      const transaction = await startTransaction(isolationLevel);
      let pending: Promise<void> = Promise.resolve();

      // Prisma can fan out relation reads on the transaction's single pg client.
      function enqueue<Args extends unknown[], Result>(
        operation: (...args: Args) => Promise<Result>,
      ) {
        return (...args: Args): Promise<Result> => {
          const result = pending.then(() => operation(...args));
          pending = result.then(
            () => undefined,
            () => undefined,
          );
          return result;
        };
      }

      transaction.queryRaw = enqueue(transaction.queryRaw.bind(transaction));
      transaction.executeRaw = enqueue(
        transaction.executeRaw.bind(transaction),
      );
      transaction.commit = enqueue(transaction.commit.bind(transaction));
      transaction.rollback = enqueue(transaction.rollback.bind(transaction));
      return transaction;
    };

    return adapter;
  }
}

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
    const adapter = new SequentialPrismaPg(pool);

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
