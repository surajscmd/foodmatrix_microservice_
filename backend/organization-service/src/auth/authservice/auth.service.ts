import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { SystemUserRole, type SystemUser } from '@prisma/client';

import { PrismaService } from '../../lib/prisma/prisma.service.js';
import { auth } from '../auths.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { RegisterDto } from './dto/register.dto.js';

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

  // ============================================================
  // REGISTER
  // ============================================================

  async register(
    dto: RegisterDto,
    creatorAuthUserId: string,
  ): Promise<RegisterResponse> {
    // ----------------------------------------------------------
    // NORMALIZE INPUT
    // ----------------------------------------------------------

    const name = dto.name.trim();
    const email = dto.email.trim().toLowerCase();

    if (!name) {
      throw new BadRequestException('Name is required');
    }

    // ----------------------------------------------------------
    // FIND CREATOR
    // ----------------------------------------------------------

    const creator = await this.prisma.systemUser.findUnique({
      where: {
        authUserId: creatorAuthUserId,
      },
    });

    if (!creator) {
      throw new NotFoundException('Creator FoodMatrix user not found');
    }

    if (!creator.isActive) {
      throw new BadRequestException('Your account is inactive');
    }

    // ----------------------------------------------------------
    // CREATOR PERMISSION
    // ONLY CENTRAL ADMINS CAN CREATE USERS
    // ----------------------------------------------------------

    const allowedCreators: SystemUserRole[] = [
      SystemUserRole.SUPER_ADMIN,
      SystemUserRole.FRANCHISE_ADMIN,
    ];

    if (!allowedCreators.includes(creator.role)) {
      throw new BadRequestException(
        'Only Super Admin or Franchise Admin can create user accounts',
      );
    }

    // ----------------------------------------------------------
    // ROLE GROUPS
    // ----------------------------------------------------------

    const restaurantRoles: SystemUserRole[] = [
      SystemUserRole.RESTAURANT_ADMIN,
      SystemUserRole.STAFF,
      SystemUserRole.OPERATIONS,
    ];

    const franchiseRoles: SystemUserRole[] = [
      SystemUserRole.SUPER_ADMIN,
      SystemUserRole.FRANCHISE_ADMIN,
    ];

    // ----------------------------------------------------------
    // TARGET ROLE VALIDATION
    // ----------------------------------------------------------

    if (
      !restaurantRoles.includes(dto.role) &&
      !franchiseRoles.includes(dto.role)
    ) {
      throw new BadRequestException('Invalid system user role');
    }

    // ----------------------------------------------------------
    // FRANCHISE ADMIN RESTRICTIONS
    // ----------------------------------------------------------

    if (creator.role === SystemUserRole.FRANCHISE_ADMIN) {
      const allowedRolesForFranchiseAdmin: SystemUserRole[] = [
        SystemUserRole.RESTAURANT_ADMIN,
        SystemUserRole.STAFF,
        SystemUserRole.OPERATIONS,
      ];

      if (!allowedRolesForFranchiseAdmin.includes(dto.role)) {
        throw new BadRequestException(
          'Franchise Admin cannot create this role',
        );
      }

      if (!creator.franchiseId) {
        throw new BadRequestException('Creator is not assigned to a franchise');
      }

      if (dto.franchiseId !== creator.franchiseId) {
        throw new BadRequestException(
          'You can only create users inside your own franchise',
        );
      }
    }

    // ----------------------------------------------------------
    // ROLE SCOPE VALIDATION
    // ----------------------------------------------------------

    // Restaurant-level users require:
    // - franchiseId
    // - managedRestaurantId

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

    // Franchise-level users require:
    // - franchiseId
    // - no managedRestaurantId

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

    // ----------------------------------------------------------
    // VALIDATE RESTAURANT
    // ----------------------------------------------------------

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

    // ----------------------------------------------------------
    // VALIDATE FRANCHISE
    // ----------------------------------------------------------

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

    // ----------------------------------------------------------
    // CHECK EXISTING SYSTEM USER
    // ----------------------------------------------------------

    const existingSystemUser = await this.prisma.systemUser.findUnique({
      where: {
        email,
      },
    });

    if (existingSystemUser) {
      throw new ConflictException(
        'FoodMatrix user already exists with this email',
      );
    }

    // ----------------------------------------------------------
    // CHECK EXISTING BETTER AUTH USER
    // ----------------------------------------------------------

    const existingAuthUser = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingAuthUser) {
      throw new ConflictException(
        'Authentication account already exists with this email',
      );
    }

    // ----------------------------------------------------------
    // CREATE BETTER AUTH USER
    // ----------------------------------------------------------

    let authUser: RegisteredAuthUser;

    try {
      const result = await auth.api.signUpEmail({
        body: {
          name,
          email,
          password: dto.password,
        },
      });

      authUser = {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        emailVerified: result.user.emailVerified,
        image: result.user.image ?? null,
        createdAt: result.user.createdAt,
        updatedAt: result.user.updatedAt,
      };
    } catch (error) {
      console.error('Better Auth registration failed:', error);

      throw new BadRequestException('Unable to create authentication account');
    }

    // ----------------------------------------------------------
    // CREATE FOODMATRIX SYSTEM USER
    // ----------------------------------------------------------

    const nameParts = name.split(/\s+/);

    const firstName = nameParts[0] ?? name;

    const lastName = nameParts.slice(1).join(' ');

    try {
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

      // --------------------------------------------------------
      // SUCCESS
      // --------------------------------------------------------

      return {
        message: 'Registration successful',
        data: {
          user: authUser,
          systemUser,
        },
      };
    } catch (error) {
      console.error('SystemUser creation failed:', error);

      // --------------------------------------------------------
      // CLEANUP AUTH USER
      // --------------------------------------------------------

      try {
        await this.prisma.user.delete({
          where: {
            id: authUser.id,
          },
        });

        console.log(`Cleaned up Auth user: ${authUser.email}`);
      } catch (cleanupError) {
        console.error('Failed to cleanup Auth user:', cleanupError);
      }

      throw new BadRequestException(
        'Registration failed while creating FoodMatrix user',
      );
    }
  }

  // ============================================================
  // CURRENT USER
  // ============================================================

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

  // ============================================================
  // CHANGE PASSWORD
  // ============================================================

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
