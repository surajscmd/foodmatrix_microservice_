import {
  BadRequestException,
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { PrismaService } from '../lib/prisma/prisma.service';
import { OrderAccess, type OrderActor, orderRoles } from './order-access';

const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
type OrderRequest = Request<Record<string, string>, unknown, unknown> & {
  orderRestaurantId?: string;
  orderActorRole?: OrderActor['role'];
};

function isOrderActor(value: unknown): value is OrderActor {
  if (!value || typeof value !== 'object') return false;
  const actor = value as Partial<OrderActor>;
  return (
    orderRoles.some((role) => role === actor.role) &&
    (actor.managedRestaurantId === null ||
      (typeof actor.managedRestaurantId === 'string' &&
        uuid.test(actor.managedRestaurantId))) &&
    Array.isArray(actor.restaurants) &&
    actor.restaurants.every(
      (restaurant: unknown) =>
        !!restaurant &&
        typeof restaurant === 'object' &&
        'id' in restaurant &&
        typeof restaurant.id === 'string' &&
        uuid.test(restaurant.id),
    )
  );
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger('OrganizationAccess');
  private lastUnavailableAt?: number;
  private readonly accessUrl = new URL(
    'order-access',
    (process.env.ORGANIZATION_SERVICE_URL ?? 'http://localhost:3001')
      .replace(/\/+$/, '')
      .concat('/'),
  );

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const access = this.reflector.getAllAndOverride(OrderAccess, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (access === 'health') return true;

    const request = context.switchToHttp().getRequest<OrderRequest>();
    const actor = await this.verifySession(request.headers.authorization);
    request.orderActorRole = actor.role;
    if (!access)
      throw new ForbiddenException('Order route has no access policy');

    if (access === 'customers') {
      if (actor.role !== 'SUPER_ADMIN')
        throw new ForbiddenException(
          'Customer administration requires a super admin',
        );
      return true;
    }

    const restaurantId = actor.managedRestaurantId?.toLowerCase();
    const assigned = actor.restaurants.map(({ id }) => id.toLowerCase());
    const restaurantAccount =
      (actor.role === 'RESTAURANT_ADMIN' || actor.role === 'STAFF') &&
      restaurantId !== undefined &&
      assigned.includes(restaurantId);

    if (access === 'dashboard') {
      if (
        actor.role !== 'SUPER_ADMIN' &&
        actor.role !== 'FRANCHISE_ADMIN' &&
        !(restaurantAccount && actor.role === 'RESTAURANT_ADMIN')
      ) {
        throw new ForbiddenException(
          'Order reporting requires a manager account',
        );
      }
      const requested = this.requireUuid(
        request.query.restaurantId ?? restaurantId,
        'restaurantId',
      );
      const allowed = restaurantAccount
        ? requested === restaurantId
        : assigned.includes(requested);
      if (!allowed)
        throw new ForbiddenException('Restaurant is outside your Order scope');
      request.orderRestaurantId = requested;
      return true;
    }

    if (!restaurantAccount)
      throw new ForbiddenException(
        'An assigned restaurant account is required',
      );
    request.orderRestaurantId = restaurantId;

    if (
      (access === 'refund-payment' || access === 'refund-order') &&
      actor.role !== 'RESTAURANT_ADMIN'
    ) {
      throw new ForbiddenException('Refunds require a restaurant manager');
    }

    const body =
      request.body &&
      typeof request.body === 'object' &&
      !Array.isArray(request.body)
        ? (request.body as Record<string, unknown>)
        : undefined;

    if (access === 'restaurant' || access === 'create-order') {
      const requested =
        access === 'restaurant'
          ? request.query.restaurantId
          : body?.restaurantId;
      if (
        requested !== undefined &&
        this.requireUuid(requested, 'restaurantId') !== restaurantId
      )
        throw new ForbiddenException('Restaurant is outside your Order scope');
      if (access === 'create-order' && body) body.restaurantId = restaurantId;
      return true;
    }

    if (access === 'payment' || access === 'refund-payment') {
      const id = this.requireUuid(
        request.params.id ?? request.params.paymentId,
        'paymentId',
      );
      const payment = await this.prisma.payment.findFirst({
        where: { id, order: { restaurantId } },
        select: { id: true },
      });
      if (!payment) throw new NotFoundException('Payment not found.');
      return true;
    }

    const orderId = this.requireUuid(
      access === 'create-payment'
        ? body?.orderId
        : (request.params.orderId ?? request.params.id),
      'orderId',
    );
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, restaurantId },
      select: { id: true },
    });
    if (!order) throw new NotFoundException('Order not found.');
    return true;
  }

  private requireUuid(value: unknown, field: string) {
    if (typeof value !== 'string' || !uuid.test(value))
      throw new BadRequestException(field + ' must be a UUID');
    return value.toLowerCase();
  }

  private async verifySession(authorization?: string) {
    const token = authorization?.match(/^Bearer (\S+)$/i)?.[1];
    if (!token) throw new UnauthorizedException('Bearer token required');

    let response: Response;
    try {
      response = await fetch(this.accessUrl, {
        headers: { Authorization: 'Bearer ' + token },
        redirect: 'error',
        signal: AbortSignal.timeout(5000),
      });
    } catch {
      this.logOrganizationFailure(
        'Organization access request failed or timed out',
      );
      throw new ServiceUnavailableException(
        'Organization access is unavailable',
      );
    }

    if ([401, 403].includes(response.status)) this.logOrganizationRecovery();
    if (response.status === 401)
      throw new UnauthorizedException('Invalid or expired session');
    if (response.status === 403)
      throw new ForbiddenException('No assigned Order scope');
    if (!response.ok) {
      this.logOrganizationFailure(
        'Organization access returned HTTP ' + response.status,
      );
      throw new ServiceUnavailableException(
        'Organization access is unavailable',
      );
    }
    const actor: unknown = await response.json().catch(() => null);
    if (!isOrderActor(actor)) {
      this.logOrganizationFailure(
        'Organization access returned an invalid response',
      );
      throw new ServiceUnavailableException(
        'Organization access response is invalid',
      );
    }
    this.logOrganizationRecovery();
    return actor;
  }

  private logOrganizationFailure(message: string) {
    const now = Date.now();
    if (
      this.lastUnavailableAt !== undefined &&
      now - this.lastUnavailableAt < 60_000
    )
      return;
    this.lastUnavailableAt = now;
    this.logger.warn(message);
  }

  private logOrganizationRecovery() {
    if (this.lastUnavailableAt === undefined) return;
    this.lastUnavailableAt = undefined;
    this.logger.log('Organization access recovered');
  }
}
