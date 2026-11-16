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
import { PrismaService } from '../lib/prisma/prisma.service.js';
import {
  InventoryAccess,
  type InventoryActor,
  type InventoryContext,
  inventoryRoles,
} from './inventory-access.js';

type InventoryRequest = Request<Record<string, string>, unknown, unknown> & {
  inventoryContext?: InventoryContext;
};

function isId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 100;
}

function isActor(value: unknown): value is InventoryActor {
  if (!value || typeof value !== 'object') return false;
  const actor = value as Partial<InventoryActor>;
  return (
    isId(actor.userId) &&
    inventoryRoles.some((role) => role === actor.role) &&
    (actor.franchiseId === null || isId(actor.franchiseId)) &&
    (actor.managedRestaurantId === null || isId(actor.managedRestaurantId)) &&
    Array.isArray(actor.restaurantIds) &&
    actor.restaurantIds.every(isId) &&
    Array.isArray(actor.warehouseIds) &&
    actor.warehouseIds.every(isId)
  );
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger('OrganizationAccess');
  private lastUnavailableAt?: number;
  private readonly accessUrl = new URL(
    'inventory-access',
    (process.env.ORGANIZATION_SERVICE_URL ?? 'http://localhost:3001')
      .replace(/\/+$/, '')
      .concat('/'),
  );

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const policy = this.reflector.getAllAndOverride(InventoryAccess, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (policy === 'health') return true;

    const request = context.switchToHttp().getRequest<InventoryRequest>();
    const actor = await this.verifySession(request.headers.authorization);
    if (!policy) throw new ForbiddenException();

    const access: InventoryContext = { userId: actor.userId };
    request.inventoryContext = access;
    if (policy === 'admin') {
      if (actor.role !== 'SUPER_ADMIN') throw new ForbiddenException();
      return true;
    }

    const body =
      request.body && typeof request.body === 'object'
        ? (request.body as Record<string, unknown>)
        : undefined;
    const params = request.params;
    if (policy === 'restaurant-read' || policy === 'restaurant-write') {
      const id = this.requiredId(
        params.restaurantId ?? body?.restaurantId,
        'restaurantId',
      );
      const allowed =
        policy === 'restaurant-read'
          ? actor.restaurantIds.includes(id)
          : this.managesRestaurant(actor, id);
      if (!allowed)
        throw new ForbiddenException(
          'Restaurant is outside your Inventory scope.',
        );
      if (policy === 'restaurant-write' && actor.franchiseId)
        access.warehouseId = actor.franchiseId;
      return true;
    }

    if (policy === 'warehouse') {
      const id = this.requiredId(
        params.warehouseId ?? body?.warehouseId,
        'warehouseId',
      );
      if (!this.managesWarehouse(actor, id))
        throw new ForbiddenException(
          'Warehouse is outside your Inventory scope.',
        );
      access.warehouseId = id;
      return true;
    }

    const id = this.requiredId(params.id, 'id');
    if (policy === 'waste-read') {
      const record = await this.prisma.wasteLog.findFirst({
        where: { id, restaurantId: { in: actor.restaurantIds } },
        select: { id: true },
      });
      if (!record) throw new NotFoundException('Waste log not found.');
      return true;
    }

    const stockRequest = policy.startsWith('request-');
    const record = stockRequest
      ? await this.prisma.stockRequest.findUnique({
          where: { id },
          select: { restaurantId: true, warehouseId: true },
        })
      : await this.prisma.stockTransfer.findUnique({
          where: { id },
          select: { toRestaurantId: true, fromWarehouseId: true },
        });

    if (record) {
      const restaurantId =
        'restaurantId' in record ? record.restaurantId : record.toRestaurantId;
      const warehouseId =
        'warehouseId' in record ? record.warehouseId : record.fromWarehouseId;
      const warehouseAllowed = this.managesWarehouse(actor, warehouseId);
      const allowed = policy.endsWith('-warehouse')
        ? warehouseAllowed
        : policy.endsWith('-restaurant')
          ? this.managesRestaurant(actor, restaurantId)
          : warehouseAllowed || actor.restaurantIds.includes(restaurantId);

      if (
        allowed &&
        (!params.restaurantId || params.restaurantId === restaurantId)
      ) {
        access.warehouseId = warehouseId;
        return true;
      }
    }
    throw new NotFoundException(
      stockRequest ? 'Stock request not found.' : 'Stock transfer not found.',
    );
  }

  private managesWarehouse(actor: InventoryActor, id: string) {
    return (
      ['SUPER_ADMIN', 'FRANCHISE_ADMIN', 'OPERATIONS'].includes(actor.role) &&
      actor.warehouseIds.includes(id)
    );
  }

  private managesRestaurant(actor: InventoryActor, id: string) {
    return (
      actor.role === 'RESTAURANT_ADMIN' &&
      actor.managedRestaurantId === id &&
      actor.restaurantIds.includes(id)
    );
  }

  private requiredId(value: unknown, field: string) {
    if (!isId(value)) throw new BadRequestException(field + ' is required.');
    return value;
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
      throw new ForbiddenException('No assigned Inventory scope');
    if (!response.ok) {
      this.logOrganizationFailure(
        'Organization access returned HTTP ' + response.status,
      );
      throw new ServiceUnavailableException(
        'Organization access is unavailable',
      );
    }
    const actor: unknown = await response.json().catch(() => null);
    if (!isActor(actor)) {
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
