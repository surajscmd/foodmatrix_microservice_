import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './lib/prisma/prisma.module.js';
import { FranchiseModule } from './modules/franchise/franchies.module.js';
import { RegionsModule } from './modules/region/regions.module.js';
import { RestaurantsModule } from './modules/restaurant/restaurants.module.js';
import { SystemUserModule } from './modules/system-user/system-user.module.js';
import { TerminalsModule } from './modules/terminal/terminal.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    FranchiseModule,
    RegionsModule,
    RestaurantsModule,
    SystemUserModule,
    TerminalsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
