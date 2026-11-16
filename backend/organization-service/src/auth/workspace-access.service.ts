import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../lib/prisma/prisma.service.js';
import {
  accountAccessInclude,
  hasWorkspaceAccess,
  isRestaurantRole,
} from './account-access.js';
import { auth } from './auths.js';
import { restaurantScope } from './organization-scope.js';

@Injectable()
export class WorkspaceAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async verifyBearer(authorization?: string) {
    const token = authorization?.match(/^Bearer (\S+)$/i)?.[1];
    if (!token) throw new UnauthorizedException('Bearer token required');
    const { payload } = await auth.api.verifyJWT({ body: { token } });
    if (
      typeof payload?.sub !== 'string' ||
      typeof payload.sessionId !== 'string'
    ) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const [session, user] = await Promise.all([
      this.prisma.session.findFirst({
        where: {
          id: payload.sessionId,
          userId: payload.sub,
          expiresAt: { gt: new Date() },
        },
        select: { id: true },
      }),
      this.prisma.systemUser.findUnique({
        where: { authUserId: payload.sub },
        include: accountAccessInclude,
      }),
    ]);
    if (!session || !user || !hasWorkspaceAccess(user))
      throw new UnauthorizedException(
        'Session, account, or restaurant is inactive',
      );

    const restaurants = await this.prisma.restaurant.findMany({
      where: restaurantScope({ ...user, id: user.authUserId }),
      select: {
        id: true,
        name: true,
        timezone: true,
        franchise: { select: { defaultCurrency: true } },
      },
    });
    if (isRestaurantRole(user.role) && !restaurants.length) {
      throw new ForbiddenException('Assigned restaurant is unavailable');
    }

    return {
      id: user.authUserId,
      systemUserId: user.id,
      role: user.role,
      franchiseId: user.franchiseId,
      managedRestaurantId: user.managedRestaurantId,
      restaurants: restaurants.map(({ franchise, ...restaurant }) => ({
        ...restaurant,
        currency: franchise.defaultCurrency,
      })),
    };
  }
}
