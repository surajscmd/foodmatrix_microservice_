import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma, SystemUserRole, type SystemUser } from '@prisma/client';
import type { AuthenticatedUser } from '../../auth/auth.guard.js';
import { requiredFranchise } from '../../auth/organization-scope.js';
import { restaurantRoles } from '../../auth/account-access.js';
import { validateAccountAssignment } from '../../auth/account-assignment.js';

import { PrismaService } from '../../lib/prisma/prisma.service.js';
import type { UpdateAssignmentDto } from './dto/update-assignment.dto.js';

@Injectable()
export class SystemUserService {
  constructor(private readonly prisma: PrismaService) {}

  private manageableUsers(
    actor: AuthenticatedUser,
  ): Prisma.SystemUserWhereInput {
    const other = {
      authUserId: { not: actor.id },
      role: { not: SystemUserRole.SUPER_ADMIN },
    };
    if (actor.role === SystemUserRole.SUPER_ADMIN) return other;
    if (actor.role === SystemUserRole.FRANCHISE_ADMIN) {
      return {
        ...other,
        franchiseId: requiredFranchise(actor),
        role: {
          in: [...restaurantRoles],
        },
      };
    }
    throw new ForbiddenException('You cannot manage system logins');
  }

  listManageable(actor: AuthenticatedUser, search: string) {
    const term = search.trim().slice(0, 100);
    return this.prisma.systemUser.findMany({
      where: {
        ...this.manageableUsers(actor),
        ...(term && {
          OR: [
            { email: { contains: term, mode: 'insensitive' } },
            { firstName: { contains: term, mode: 'insensitive' } },
            { lastName: { contains: term, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: [{ email: 'asc' }, { id: 'asc' }],
      take: 25,
    });
  }

  async setActive(actor: AuthenticatedUser, id: string, isActive: boolean) {
    const scope = this.manageableUsers(actor);
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.systemUser.updateMany({
        where: { ...scope, id },
        data: { isActive },
      });
      if (!result.count)
        throw new NotFoundException('Manageable system login not found');
      const user = await tx.systemUser.findUniqueOrThrow({ where: { id } });
      if (!isActive)
        await tx.session.deleteMany({ where: { userId: user.authUserId } });
      return user;
    });
  }

  async updateAssignment(
    actor: AuthenticatedUser,
    id: string,
    dto: UpdateAssignmentDto,
  ) {
    const scope = this.manageableUsers(actor);
    if (dto.role === SystemUserRole.SUPER_ADMIN)
      throw new ForbiddenException(
        'Super admin access cannot be assigned here',
      );
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const current = await tx.systemUser.findFirst({
            where: { ...scope, id },
          });
          if (!current)
            throw new NotFoundException('Manageable system login not found');
          const assignment = await validateAccountAssignment(tx, actor, dto);
          if (
            current.role === assignment.role &&
            current.franchiseId === assignment.franchiseId &&
            current.managedRestaurantId === assignment.managedRestaurantId
          ) {
            return current;
          }
          const updated = await tx.systemUser.update({
            where: { id },
            data: assignment,
          });
          await tx.session.deleteMany({
            where: { userId: updated.authUserId },
          });
          return updated;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2034'
      )
        throw new ConflictException(
          'Login assignment changed. Refresh and try again.',
        );
      throw error;
    }
  }

  /**
   * Find SystemUser using Better Auth user ID.
   */
  async findByAuthUserId(authUserId: string): Promise<SystemUser> {
    const systemUser = await this.prisma.systemUser.findUnique({
      where: {
        authUserId,
      },
    });

    if (!systemUser) {
      throw new NotFoundException('System user not found');
    }

    return systemUser;
  }

  /**
   * Find SystemUser by its UUID.
   */
  async findOne(id: string): Promise<SystemUser> {
    const systemUser = await this.prisma.systemUser.findUnique({
      where: {
        id,
      },
    });

    if (!systemUser) {
      throw new NotFoundException('System user not found');
    }

    return systemUser;
  }
}
