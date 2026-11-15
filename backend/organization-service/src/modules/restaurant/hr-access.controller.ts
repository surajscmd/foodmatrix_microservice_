import {
  Controller,
  ForbiddenException,
  Get,
  Header,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { auth } from '../../auth/auths.js';
import { restaurantScope } from '../../auth/organization-scope.js';
import { PrismaService } from '../../lib/prisma/prisma.service.js';

@Controller('hr-access')
export class HrAccessController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  // HR uses a signed bearer token in place of a browser session.
  @AllowAnonymous()
  @Header('Cache-Control', 'private, no-store')
  async context(@Headers('authorization') authorization?: string) {
    const token = authorization?.match(/^Bearer (\S+)$/i)?.[1];
    if (!token) throw new UnauthorizedException('Bearer token required');
    const { payload } = await auth.api.verifyJWT({ body: { token } });
    if (typeof payload?.sub !== 'string') {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const user = await this.prisma.systemUser.findUnique({
      where: { authUserId: payload.sub },
      select: {
        id: true,
        authUserId: true,
        isActive: true,
        role: true,
        franchiseId: true,
        managedRestaurantId: true,
      },
    });
    if (!user?.isActive) throw new UnauthorizedException('Inactive account');

    const restaurants = await this.prisma.restaurant.findMany({
      where: restaurantScope({ ...user, id: user.authUserId }),
      select: {
        id: true,
        name: true,
        timezone: true,
        franchise: { select: { defaultCurrency: true } },
      },
    });
    if (
      user.managedRestaurantId &&
      ['OPERATIONS', 'RESTAURANT_ADMIN', 'STAFF'].includes(user.role) &&
      !restaurants.length
    ) {
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
