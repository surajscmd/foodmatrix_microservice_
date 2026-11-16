import { NotificationAccessModule } from '../auth/notification-access.module.js';
import { Module } from '@nestjs/common';

import { NotificationGateway } from './notification.gateway.js';

@Module({
  imports: [NotificationAccessModule],
  providers: [NotificationGateway],

  exports: [NotificationGateway],
})
export class SocketModule {}
