import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';

import { Reflector } from '@nestjs/core';
import { SystemUserRole } from '@prisma/client';

import { fromNodeHeaders } from 'better-auth/node';
import type { Request } from 'express';

import { PrismaService } from '../lib/prisma/prisma.service.js';
import { auth } from './auths.js';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: SystemUserRole[]) =>
  SetMetadata(ROLES_KEY, roles);

export interface AuthenticatedUser {
  id: string;
  role: SystemUserRole;
  franchiseId: string | null;
  managedRestaurantId: string | null;
}

export type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    // ------------------------------------------------------------
    // AUTHENTICATION
    // ------------------------------------------------------------

    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });

    if (!session?.user) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    // ------------------------------------------------------------
    // GET FOODMatrix SYSTEM USER
    // ------------------------------------------------------------

    const systemUser = await this.prisma.systemUser.findUnique({
      where: {
        authUserId: session.user.id,
      },
    });

    if (!systemUser) {
      throw new UnauthorizedException('FoodMatrix system user not found');
    }

    if (!systemUser.isActive) {
      throw new UnauthorizedException('System user is inactive');
    }

    // ------------------------------------------------------------
    // ATTACH AUTHENTICATED USER TO REQUEST
    // ------------------------------------------------------------

    request.user = {
      id: systemUser.authUserId,
      role: systemUser.role,
      franchiseId: systemUser.franchiseId,
      managedRestaurantId: systemUser.managedRestaurantId,
    };

    // ------------------------------------------------------------
    // ROLE AUTHORIZATION
    // ------------------------------------------------------------

    const requiredRoles = this.reflector.getAllAndOverride<SystemUserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No role restriction on endpoint
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    if (!requiredRoles.includes(systemUser.role)) {
      throw new ForbiddenException(
        'You do not have permission to access this resource',
      );
    }

    return true;
  }
}
