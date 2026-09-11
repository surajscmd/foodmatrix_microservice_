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
    body: { restaurantId: string },
  ): Promise<void> {
    const room = `restaurant:${body.restaurantId}`;

    await client.join(room);

    this.logger.log(`Socket ${client.id} joined ${room}`);
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
  emitToRestaurant(restaurantId: string, notification: unknown): void {
    this.server
      .to(`restaurant:${restaurantId}`)
      .emit('notification:new', notification);
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
