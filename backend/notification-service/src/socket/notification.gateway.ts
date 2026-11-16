import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import {
  NotificationAccessService,
  type NotificationLocation,
} from '../auth/notification-access.service.js';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/notifications',
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private readonly server!: Server;

  private readonly checks = new Map<Socket, ReturnType<typeof setInterval>>();

  constructor(private readonly access: NotificationAccessService) {}

  handleConnection(client: Socket): void {
    const timer = setInterval(() => void this.checkRooms(client), 60_000);
    timer.unref();
    this.checks.set(client, timer);
  }

  handleDisconnect(client: Socket): void {
    clearInterval(this.checks.get(client));
    this.checks.delete(client);
  }

  @SubscribeMessage('join-restaurant')
  joinRestaurant(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { restaurantId?: string } | null,
  ) {
    return this.join(client, 'restaurant', body?.restaurantId);
  }

  @SubscribeMessage('join-warehouse')
  joinWarehouse(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { warehouseId?: string } | null,
  ) {
    return this.join(client, 'warehouse', body?.warehouseId);
  }

  @SubscribeMessage('leave-restaurant')
  async leaveRestaurant(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { restaurantId?: string } | null,
  ) {
    if (typeof body?.restaurantId === 'string')
      await client.leave('restaurant:' + body.restaurantId.toLowerCase());
  }

  @SubscribeMessage('leave-warehouse')
  async leaveWarehouse(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { warehouseId?: string } | null,
  ) {
    if (typeof body?.warehouseId === 'string')
      await client.leave('warehouse:' + body.warehouseId.toLowerCase());
  }

  emitToRestaurant(restaurantId: string, notification: { id: string }): void {
    this.server.to('restaurant:' + restaurantId).emit('notification:new', {
      id: notification.id,
      scope: 'RESTAURANT',
      restaurantId,
    });
  }

  emitToWarehouse(warehouseId: string, notification: { id: string }): void {
    this.server.to('warehouse:' + warehouseId).emit('notification:new', {
      id: notification.id,
      scope: 'WAREHOUSE',
      warehouseId,
    });
  }

  private async join(
    client: Socket,
    location: NotificationLocation,
    id: unknown,
  ) {
    if (typeof id !== 'string' || !id) return { joined: false };

    try {
      const actor = await this.access.fromCookie(
        client.handshake.headers.cookie,
      );
      const normalizedId = id.toLowerCase();
      if (
        !client.connected ||
        !this.access.allows(actor, location, normalizedId)
      )
        return { joined: false };

      await client.join(location + ':' + normalizedId);
      return { joined: true };
    } catch {
      return { joined: false };
    }
  }

  private async checkRooms(client: Socket) {
    const rooms = [...client.rooms].filter(
      (room) => room.startsWith('restaurant:') || room.startsWith('warehouse:'),
    );
    if (!rooms.length) return;

    try {
      const actor = await this.access.fromCookie(
        client.handshake.headers.cookie,
      );
      const staleRoom = rooms.some((room) => {
        const [location, id] = room.split(':');
        return !this.access.allows(
          actor,
          location === 'restaurant' ? 'restaurant' : 'warehouse',
          id,
        );
      });
      if (staleRoom) client.disconnect();
    } catch {
      client.disconnect();
    }
  }
}
