import { HealthController } from './health.controller';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CustomerModule } from './module/customer/customer.module';
import { OrdersModule } from './module/orders/orders.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './lib/prisma/prisma.module';
import { PaymentModule } from './module/payment/payment.module';
import { AuthModule } from './auth/auth.module';
import { KafkaModule } from './kafka/kafka.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    OrdersModule,
    CustomerModule,
    PaymentModule,
    KafkaModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
