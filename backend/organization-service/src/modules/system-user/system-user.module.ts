import { Module } from '@nestjs/common';
import { SystemUserController } from './system-user.controller.js';
import { SystemUserService } from './system-user.service.js';

@Module({
  controllers: [SystemUserController],
  providers: [SystemUserService],
})
export class SystemUserModule {}
