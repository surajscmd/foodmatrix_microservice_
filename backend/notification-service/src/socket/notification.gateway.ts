import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Logger } from '@nestjs/common';

import type { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/notifications',
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(NotificationGateway.name);
  private readonly organizationUrl = (
    process.env.ORGANIZATION_SERVICE_URL ?? 'http://localhost:3001'
  ).replace(/\/+$/, '');

  @WebSocketServer()
  private readonly server!: Server;

  // ============================================================
  // CONNECTION
  // ============================================================

  /**
   * Handle a new Socket.IO connection.
   */
  handleConnection(client: Socket): void {
    this.logger.log(`Socket connected: ${client.id}`);
  }

  // ============================================================
  // DISCONNECTION
  // ============================================================

  /**
   * Handle Socket.IO disconnection.
   */
  handleDisconnect(client: Socket): void {
    this.logger.log(`Socket disconnected: ${client.id}`);
  }

  // ============================================================
  // JOIN RESTAURANT
  // ============================================================

  /**
   * Join a restaurant notification room.
   */
  @SubscribeMessage('join-restaurant')
  async joinRestaurant(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    body: { restaurantId?: string } | null,
  ): Promise<{ joined: boolean }> {
    const cookie = client.handshake.headers.cookie;
    const restaurantId = body?.restaurantId;
    if (!cookie || typeof restaurantId !== 'string' || !restaurantId) {
      return { joined: false };
    }

    try {
      const response = await fetch(`${this.organizationUrl}/auth/me`, {
        headers: { Cookie: cookie, Accept: 'application/json' },
        redirect: 'error',
        signal: AbortSignal.timeout(5_000),
      });
      if (!response.ok) return { joined: false };

      const session = (await response.json()) as {
        data?: {
          systemUser?: {
            isActive: boolean;
            role: string;
            managedRestaurantId: string | null;
          };
        };
      };
      const user = session.data?.systemUser;
      if (
        !client.connected ||
        !user?.isActive ||
        (user.role !== 'RESTAURANT_ADMIN' && user.role !== 'STAFF') ||
        user.managedRestaurantId !== restaurantId
      ) {
        return { joined: false };
      }

      await client.join(`restaurant:${restaurantId}`);
      return { joined: true };
    } catch {
      this.logger.warn('Could not verify a restaurant notification session');
      return { joined: false };
    }
  }

  // ============================================================
  // JOIN WAREHOUSE
  // ============================================================

  /**
   * Join a warehouse notification room.
   */
  @SubscribeMessage('join-warehouse')
  async joinWarehouse(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    body: { warehouseId: string },
  ): Promise<void> {
    const room = `warehouse:${body.warehouseId}`;

    await client.join(room);

    this.logger.log(`Socket ${client.id} joined ${room}`);
  }

  // ============================================================
  // LEAVE RESTAURANT
  // ============================================================

  /**
   * Leave a restaurant notification room.
   */
  @SubscribeMessage('leave-restaurant')
  async leaveRestaurant(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    body: { restaurantId: string },
  ): Promise<void> {
    const room = `restaurant:${body.restaurantId}`;

    await client.leave(room);
  }

  // ============================================================
  // LEAVE WAREHOUSE
  // ============================================================

  /**
   * Leave a warehouse notification room.
   */
  @SubscribeMessage('leave-warehouse')
  async leaveWarehouse(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    body: { warehouseId: string },
  ): Promise<void> {
    const room = `warehouse:${body.warehouseId}`;

    await client.leave(room);
  }

  // ============================================================
  // EMIT RESTAURANT NOTIFICATION
  // ============================================================

  /**
   * Send a new notification to all clients
   * connected to a restaurant room.
   */
  emitToRestaurant(restaurantId: string, notification: { id: string }): void {
    this.server.to(`restaurant:${restaurantId}`).emit('notification:new', {
      id: notification.id,
      scope: 'RESTAURANT',
      restaurantId,
    });
  }

  // ============================================================
  // EMIT WAREHOUSE NOTIFICATION
  // ============================================================

  /**
   * Send a new notification to all clients
   * connected to a warehouse room.
   */
  emitToWarehouse(warehouseId: string, notification: unknown): void {
    this.server
      .to(`warehouse:${warehouseId}`)
      .emit('notification:new', notification);
  }
}
