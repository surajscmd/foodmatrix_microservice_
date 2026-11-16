import { NotificationAccessModule } from '../../auth/notification-access.module.js';
import { NotificationGuard } from '../../auth/notification.guard.js';
import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';

@Module({
  imports: [NotificationAccessModule],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationGuard],
})
export class NotificationModule {}
