import { Module } from '@nestjs/common';
import { NotificationAccessService } from './notification-access.service.js';

@Module({
  providers: [NotificationAccessService],
  exports: [NotificationAccessService],
})
export class NotificationAccessModule {}
