import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { SystemUserRole, type SystemUser } from '@prisma/client';

import { PrismaService } from '../../lib/prisma/prisma.service.js';
import { auth } from '../auths.js';
import { RegisterDto } from './dto/register.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';

type RegisteredAuthUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type RegisterResponse = {
  message: string;
  data: {
    user: RegisteredAuthUser;
    systemUser: SystemUser;
  };
};

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(dto: RegisterDto): Promise<RegisterResponse> {
    const restaurantRoles: SystemUserRole[] = [
      SystemUserRole.RESTAURANT_ADMIN,
      SystemUserRole.STAFF,
      SystemUserRole.OPERATIONS,
    ];

    const franchiseRoles: SystemUserRole[] = [
      SystemUserRole.SUPER_ADMIN,
      SystemUserRole.FRANCHISE_ADMIN,
    ];

    // ------------------------------------------------------------
    // ROLE SCOPE VALIDATION
    // ------------------------------------------------------------

    // Restaurant-level users must belong to both:
    // - a franchise
    // - a specific restaurant
    if (restaurantRoles.includes(dto.role)) {
      if (!dto.franchiseId) {
        throw new BadRequestException(`${dto.role} requires franchiseId`);
      }

      if (!dto.managedRestaurantId) {
        throw new BadRequestException(
          `${dto.role} requires managedRestaurantId`,
        );
      }
    }

    // Franchise-level users must belong to the franchise
    // and must not be assigned to a specific restaurant.
    if (franchiseRoles.includes(dto.role)) {
      if (!dto.franchiseId) {
        throw new BadRequestException(`${dto.role} requires franchiseId`);
      }

      if (dto.managedRestaurantId) {
        throw new BadRequestException(
          `${dto.role} cannot have managedRestaurantId`,
        );
      }
    }

    // ------------------------------------------------------------
    // VALIDATE RESTAURANT
    // ------------------------------------------------------------

    if (dto.managedRestaurantId) {
      const restaurant = await this.prisma.restaurant.findUnique({
        where: {
          id: dto.managedRestaurantId,
        },
      });

      if (!restaurant) {
        throw new NotFoundException('Restaurant not found');
      }

      if (!dto.franchiseId) {
        throw new BadRequestException(
          'franchiseId is required when managedRestaurantId is provided',
        );
      }

      if (restaurant.franchiseId !== dto.franchiseId) {
        throw new BadRequestException(
          'Restaurant does not belong to the specified franchise',
        );
      }
    }

    // ------------------------------------------------------------
    // VALIDATE FRANCHISE
    // ------------------------------------------------------------

    if (dto.franchiseId) {
      const franchise = await this.prisma.franchise.findUnique({
        where: {
          id: dto.franchiseId,
        },
      });

      if (!franchise) {
        throw new NotFoundException('Franchise not found');
      }
    }

    // ------------------------------------------------------------
    // CHECK EXISTING SYSTEM USER
    // ------------------------------------------------------------

    const existingSystemUser = await this.prisma.systemUser.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (existingSystemUser) {
      throw new ConflictException('System user already exists with this email');
    }

    // ------------------------------------------------------------
    // CREATE BETTER AUTH USER
    // ------------------------------------------------------------

    const result = await auth.api.signUpEmail({
      body: {
        name: dto.name,
        email: dto.email,
        password: dto.password,
      },
    });

    const authUser: RegisteredAuthUser = {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      emailVerified: result.user.emailVerified,
      image: result.user.image ?? null,
      createdAt: result.user.createdAt,
      updatedAt: result.user.updatedAt,
    };

    // ------------------------------------------------------------
    // CREATE FOODMATRIX SYSTEM USER
    // ------------------------------------------------------------

    const nameParts = dto.name.trim().split(/\s+/);

    const firstName = nameParts[0] ?? dto.name;
    const lastName = nameParts.slice(1).join(' ');

    const systemUser = await this.prisma.systemUser.create({
      data: {
        authUserId: authUser.id,
        firstName,
        lastName,
        email: authUser.email,
        role: dto.role,
        franchiseId: dto.franchiseId ?? null,
        managedRestaurantId: dto.managedRestaurantId ?? null,
      },
    });

    // ------------------------------------------------------------
    // RESPONSE
    // ------------------------------------------------------------

    return {
      message: 'Registration successful',
      data: {
        user: authUser,
        systemUser,
      },
    };
  }

  async getCurrentUser(authUserId: string): Promise<SystemUser> {
    const systemUser = await this.prisma.systemUser.findUnique({
      where: {
        authUserId,
      },
    });

    if (!systemUser) {
      throw new NotFoundException('FoodMatrix system user not found');
    }

    return systemUser;
  }

  async changePassword(
    request: Request,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    await auth.api.changePassword({
      body: {
        currentPassword: dto.currentPassword,
        newPassword: dto.newPassword,
        revokeOtherSessions: true,
      },
      headers: request.headers,
    });

    return {
      message: 'Password changed successfully',
    };
  }
}
