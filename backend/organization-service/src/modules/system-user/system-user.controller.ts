import {
  Controller,
  Body,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { SystemUserRole, type SystemUser } from '@prisma/client';

import {
  AuthGuard,
  AuthenticatedRequest,
  Roles,
} from '../../auth/auth.guard.js';

import { SystemUserService } from './system-user.service.js';
import { IsBoolean } from 'class-validator';

class UpdateLoginStatusDto {
  @IsBoolean()
  isActive!: boolean;
}

type SystemUserResponse = {
  message: string;
  data: SystemUser;
};

@Controller('system-users')
@UseGuards(AuthGuard)
@Roles(
  SystemUserRole.SUPER_ADMIN,
  SystemUserRole.FRANCHISE_ADMIN,
  SystemUserRole.RESTAURANT_ADMIN,
)
export class SystemUserController {
  constructor(private readonly systemUserService: SystemUserService) {}

  @Get()
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.FRANCHISE_ADMIN)
  async list(
    @Req() req: AuthenticatedRequest,
    @Query('search') search?: string,
  ) {
    return {
      data: await this.systemUserService.listManageable(
        req.user!,
        typeof search === 'string' ? search : '',
      ),
    };
  }

  @Patch(':id/status')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.FRANCHISE_ADMIN)
  async setActive(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLoginStatusDto,
  ) {
    return {
      data: await this.systemUserService.setActive(req.user!, id, dto.isActive),
    };
  }

  /**
   * Get SystemUser by Better Auth user ID.
   */
  @Get('auth/:authUserId')
  async findByAuthUserId(
    @Req() req: AuthenticatedRequest,
    @Param('authUserId') authUserId: string,
  ): Promise<SystemUserResponse> {
    const currentUser = req.user!;

    const data = await this.systemUserService.findByAuthUserId(authUserId);

    this.checkScope(currentUser, data);

    return {
      message: 'System user fetched successfully',
      data,
    };
  }

  /**
   * Get SystemUser by FoodMatrix UUID.
   */
  @Get(':id')
  async findOne(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SystemUserResponse> {
    const currentUser = req.user!;

    const data = await this.systemUserService.findOne(id);

    this.checkScope(currentUser, data);

    return {
      message: 'System user fetched successfully',
      data,
    };
  }

  /**
   * Check whether the authenticated user
   * can access the target SystemUser.
   */
  private checkScope(
    currentUser: AuthenticatedRequest['user'],
    targetUser: SystemUser,
  ): void {
    if (!currentUser) {
      throw new ForbiddenException('Authenticated user not found');
    }

    // SUPER_ADMIN can access every SystemUser.
    if (currentUser.role === SystemUserRole.SUPER_ADMIN) {
      return;
    }

    // FRANCHISE_ADMIN can access users
    // belonging to the same franchise.
    if (currentUser.role === SystemUserRole.FRANCHISE_ADMIN) {
      if (
        !currentUser.franchiseId ||
        targetUser.franchiseId !== currentUser.franchiseId
      ) {
        throw new ForbiddenException(
          'You do not have access to this system user',
        );
      }

      return;
    }

    // RESTAURANT_ADMIN can access users
    // belonging to the same managed restaurant.
    if (currentUser.role === SystemUserRole.RESTAURANT_ADMIN) {
      if (
        !currentUser.managedRestaurantId ||
        targetUser.managedRestaurantId !== currentUser.managedRestaurantId
      ) {
        throw new ForbiddenException(
          'You do not have access to this system user',
        );
      }

      return;
    }

    throw new ForbiddenException('You do not have access to this system user');
  }
}
