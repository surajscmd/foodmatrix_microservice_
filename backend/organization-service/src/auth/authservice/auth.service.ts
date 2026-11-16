import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isAPIError } from 'better-auth/api';
import { fromNodeHeaders } from 'better-auth/node';
import type { Request } from 'express';

import { type SystemUser } from '@prisma/client';

import { PrismaService } from '../../lib/prisma/prisma.service.js';
import { auth } from '../auths.js';
import { validateAccountAssignment } from '../account-assignment.js';
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
    // VALIDATE ACCOUNT ASSIGNMENT
    // ----------------------------------------------------------

    const assignment = await validateAccountAssignment(
      this.prisma,
      creator,
      dto,
    );

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
          ...assignment,
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
  ): Promise<string[]> {
    try {
      const result = await auth.api.changePassword({
        body: {
          currentPassword: dto.currentPassword,
          newPassword: dto.newPassword,
          revokeOtherSessions: true,
        },
        headers: fromNodeHeaders(request.headers),
        returnHeaders: true,
      });
      return result.headers.getSetCookie();
    } catch (error) {
      if (isAPIError(error) && error.statusCode < 500) {
        throw new HttpException(error.message, error.statusCode);
      }
      throw error;
    }
  }
}
