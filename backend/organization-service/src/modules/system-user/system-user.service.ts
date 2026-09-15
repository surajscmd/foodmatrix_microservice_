import { Injectable, NotFoundException } from '@nestjs/common';

import { SystemUser } from '@prisma/client';

import { PrismaService } from '../../lib/prisma/prisma.service.js';

@Injectable()
export class SystemUserService {
  constructor(private readonly prisma: PrismaService) {}

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
