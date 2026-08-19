import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { PrismaService } from '../../lib/prisma/prisma.service.js';

import { CreateSystemUserDto } from './dto/create-system-user.dto.js';
import { UpdateSystemUserDto } from './dto/update-system-user.dto.js';
import { UpdateSystemUserStatusDto } from './dto/update-system-user-status.dto.js';
import { validateSystemUserScope } from '../../common/utils/scope-validation.util.js';

@Injectable()
export class SystemUserService {
  constructor(private readonly prisma: PrismaService) {}
  // ============================================================
  // CREATE
  // ============================================================
  async create(payload: CreateSystemUserDto) {
    // 1. Check Better Auth user
    const authUser = await this.prisma.systemUser.findUnique({
      where: { authUserId: payload.authUserId },
    });

    if (authUser) {
      throw new ConflictException(
        'This Better Auth user is already linked to a system user.',
      );
    }

    // 2. Check email
    const emailUser = await this.prisma.systemUser.findUnique({
      where: { email: payload.email },
    });

    if (emailUser) {
      throw new ConflictException(
        `System user with email '${payload.email}' already exists.`,
      );
    }

    // 3. Validate role and organizational scope using the UTILITY FUNCTION
    await validateSystemUserScope(
      this.prisma, // <-- Pass Prisma so the util can query the DB
      payload.role,
      payload.franchiseId,
      payload.managedRegionId,
      payload.managedRestaurantId,
    );

    // 4. Build strongly typed Prisma input
    const data: Prisma.SystemUserCreateInput = {
      authUserId: payload.authUserId,
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      role: payload.role,
      franchise: payload.franchiseId
        ? { connect: { id: payload.franchiseId } }
        : undefined,
      region: payload.managedRegionId
        ? { connect: { id: payload.managedRegionId } }
        : undefined,
      restaurant: payload.managedRestaurantId
        ? { connect: { id: payload.managedRestaurantId } }
        : undefined,
    };

    // 5. Execute without try-catch (let errors bubble up to filter)
    return this.prisma.systemUser.create({
      data,
      include: {
        franchise: true,
        region: true,
        restaurant: {
          include: {
            region: true,
          },
        },
      },
    });
  }
  // ============================================================
  // FIND ALL
  // ============================================================

  async findAll() {
    return this.prisma.systemUser.findMany({
      orderBy: {
        createdAt: 'desc',
      },

      include: {
        franchise: true,

        region: true,

        restaurant: {
          include: {
            region: true,
          },
        },
      },
    });
  }

  // ============================================================
  // FIND ONE
  // ============================================================

  async findOne(id: string) {
    const systemUser = await this.prisma.systemUser.findUnique({
      where: {
        id,
      },

      include: {
        franchise: true,

        region: true,

        restaurant: {
          include: {
            region: true,
          },
        },
      },
    });

    if (!systemUser) {
      throw new NotFoundException(`System user with ID '${id}' not found.`);
    }

    return systemUser;
  }
  // ============================================================
  // UPDATE (SMART AUTO-CLEANUP)
  // ============================================================

  async update(id: string, payload: UpdateSystemUserDto) {
    const existingUser = await this.findOne(id);

    // 1. Check Auth ID & Email duplication
    if (
      payload.authUserId !== undefined &&
      payload.authUserId !== existingUser.authUserId
    ) {
      const authUser = await this.prisma.systemUser.findUnique({
        where: { authUserId: payload.authUserId },
      });
      if (authUser)
        throw new ConflictException(
          'This Better Auth user is already linked to another system user.',
        );
    }

    if (payload.email !== undefined && payload.email !== existingUser.email) {
      const emailUser = await this.prisma.systemUser.findUnique({
        where: { email: payload.email },
      });
      if (emailUser)
        throw new ConflictException(
          `System user with email '${payload.email}' already exists.`,
        );
    }

    // 2. Determine the final role
    const finalRole = payload.role ?? existingUser.role;

    // 3. Smart Scope Resolution (Merge payload with existing data)
    let finalFranchiseId =
      payload.franchiseId !== undefined
        ? payload.franchiseId
        : existingUser.franchiseId;
    let finalRegionId =
      payload.managedRegionId !== undefined
        ? payload.managedRegionId
        : existingUser.managedRegionId;
    let finalRestaurantId =
      payload.managedRestaurantId !== undefined
        ? payload.managedRestaurantId
        : existingUser.managedRestaurantId;

    // 🌟 THE MAGIC: Auto-clean scopes based on the resulting role
    if (finalRole === 'SUPER_ADMIN') {
      finalFranchiseId = null;
      finalRegionId = null;
      finalRestaurantId = null;
    } else if (finalRole === 'FRANCHISE_ADMIN') {
      finalRegionId = null;
      finalRestaurantId = null;
    } else if (finalRole === 'REGIONAL_ADMIN') {
      finalRestaurantId = null;
    }

    // 4. Validate the resulting combination (Ensures DB integrity)
    await validateSystemUserScope(
      this.prisma,
      finalRole,
      finalFranchiseId ?? undefined,
      finalRegionId ?? undefined,
      finalRestaurantId ?? undefined,
    );

    // 5. Build strongly typed update payload
    const data: Prisma.SystemUserUpdateInput = {};

    if (payload.authUserId !== undefined) data.authUserId = payload.authUserId;
    if (payload.firstName !== undefined) data.firstName = payload.firstName;
    if (payload.lastName !== undefined) data.lastName = payload.lastName;
    if (payload.email !== undefined) data.email = payload.email;
    if (payload.role !== undefined) data.role = payload.role;

    // 6. Apply database connections/disconnections ONLY if they changed
    if (finalFranchiseId !== existingUser.franchiseId) {
      data.franchise = finalFranchiseId
        ? { connect: { id: finalFranchiseId } }
        : { disconnect: true };
    }
    if (finalRegionId !== existingUser.managedRegionId) {
      data.region = finalRegionId
        ? { connect: { id: finalRegionId } }
        : { disconnect: true };
    }
    if (finalRestaurantId !== existingUser.managedRestaurantId) {
      data.restaurant = finalRestaurantId
        ? { connect: { id: finalRestaurantId } }
        : { disconnect: true };
    }

    // 7. Execute update
    return this.prisma.systemUser.update({
      where: { id },
      data,
      include: {
        franchise: true,
        region: true,
        restaurant: { include: { region: true } },
      },
    });
  }

  // ============================================================
  // UPDATE STATUS
  // ============================================================

  async updateStatus(id: string, payload: UpdateSystemUserStatusDto) {
    await this.findOne(id);
    return this.prisma.systemUser.update({
      where: {
        id,
      },

      data: {
        isActive: payload.isActive,
      },
    });
  }

  // ============================================================
  // DELETE (HARD DELETE)
  // ============================================================

  async remove(id: string) {
    // 1. Check if user exists (throws 404 if not found)
    await this.findOne(id);

    try {
      // 2. Perform the hard delete
      return await this.prisma.systemUser.delete({
        where: {
          id,
        },
      });
    } catch (error: unknown) {
      this.handlePrismaError(error);
    }
  }

  // ============================================================
  // PRISMA ERROR HANDLER
  // ============================================================

  private handlePrismaError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // P2002: Unique constraint failed (Happens on Create/Update)
      if (error.code === 'P2002') {
        throw new ConflictException(
          'A system user with the same unique information already exists.',
        );
      }

      // P2025: Record not found (Happens on Update/Delete if race condition occurs)
      if (error.code === 'P2025') {
        throw new NotFoundException('System user was not found.');
      }

      // P2003: Foreign key constraint failed (CRITICAL FOR DELETE)
      if (error.code === 'P2003') {
        throw new ConflictException(
          'Cannot delete this user because they are linked to other records. Please deactivate their status instead.',
        );
      }
    }

    // Re-throw any other unexpected errors
    throw error;
  }
}
