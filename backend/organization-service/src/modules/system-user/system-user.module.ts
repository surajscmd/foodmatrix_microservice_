import { Module } from '@nestjs/common';
import { SystemUserService } from './system-user.service.js';
import { SystemUserController } from './system-user.controller.js';

@Module({
  controllers: [SystemUserController],
  providers: [SystemUserService],
})
export class SystemUserModule {}
