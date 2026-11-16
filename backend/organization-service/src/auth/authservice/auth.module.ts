import { Module, type OnApplicationShutdown } from '@nestjs/common';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';

import { PrismaModule } from '../../lib/prisma/prisma.module.js';
import { auth, closeAuthDatabase } from '../auths.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { AuthGuard } from '../auth.guard.js';

@Module({
  imports: [PrismaModule, BetterAuthModule.forRoot({ auth })],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],
  exports: [AuthService, AuthGuard],
})
export class AuthModule implements OnApplicationShutdown {
  onApplicationShutdown() {
    return closeAuthDatabase();
  }
}
