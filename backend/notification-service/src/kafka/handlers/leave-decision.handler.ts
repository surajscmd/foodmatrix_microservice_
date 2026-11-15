import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PrismaService } from '../../lib/prisma/prisma.service.js';
import { NotificationGateway } from '../../socket/notification.gateway.js';

export interface LeaveDecisionEvent {
  leaveId: string;
  restaurantId: string;
  status: 'APPROVED' | 'REJECTED' | 'REVOKED';
  startDate: string;
  endDate: string;
}

export function isLeaveDecision(event: unknown): event is LeaveDecisionEvent {
  if (!event || typeof event !== 'object') return false;
  const value = event as Record<string, unknown>;
  return (
    typeof value.leaveId === 'string' &&
    typeof value.restaurantId === 'string' &&
    typeof value.startDate === 'string' &&
    typeof value.endDate === 'string' &&
    (value.status === 'APPROVED' ||
      value.status === 'REJECTED' ||
      value.status === 'REVOKED')
  );
}

@Injectable()
export class LeaveDecisionHandler {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationGateway,
  ) {}

  async handle(event: LeaveDecisionEvent) {
    const decision = event.status.toLowerCase();
    const hash = createHash('sha256')
      .update(`leave-decision:${event.leaveId}:${decision}`)
      .digest('hex');
    const id = `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-8${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
    const result = await this.prisma.notification.createMany({
      skipDuplicates: true,
      data: [
        {
          id,
          scope: 'RESTAURANT',
          restaurantId: event.restaurantId,
          type: 'LEAVE_APPLIED',
          priority: 'NORMAL',
          title: `Leave ${decision}`,
          message: `Leave from ${event.startDate} to ${event.endDate} was ${decision}.`,
          referenceId: event.leaveId,
          referenceType: 'Leave',
        },
      ],
    });
    if (!result.count) return;
    const notification = await this.prisma.notification.findUniqueOrThrow({
      where: { id },
    });
    this.gateway.emitToRestaurant(event.restaurantId, notification);
  }
}
