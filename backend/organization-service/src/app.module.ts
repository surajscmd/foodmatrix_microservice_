import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './lib/prisma/prisma.module.js';

import { AuthModule } from './auth/authservice/auth.module.js';
import { SystemUserModule } from './modules/system-user/system-user.module.js';
import { FranchiseModule } from './modules/franchise/franchise.module.js';
import { RestaurantModule } from './modules/restaurant/restaurant.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    SystemUserModule,
    FranchiseModule,
    RestaurantModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
