import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import * as crypto from 'crypto';

import { CreateTerminalDto } from './dto/create-terminal.dto.js';
import { UpdateTerminalDto } from './dto/update-terminal.dto.js';
import { UpdateTerminalStatusDto } from './dto/update-terminal-status.dto.js';
import { PrismaService } from '../../lib/prisma/prisma.service.js';

@Injectable()
export class TerminalService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // CREATE
  // ============================================================

  async create(dto: CreateTerminalDto) {
    // ----------------------------------------------------------
    // Check duplicate terminal name inside the restaurant
    // ----------------------------------------------------------

    const existing = await this.prisma.terminal.findFirst({
      where: {
        restaurantId: dto.restaurantId,
        name: dto.name,
      },
    });

    if (existing) {
      throw new ConflictException(
        'A terminal with this name already exists in this restaurant.',
      );
    }

    // ----------------------------------------------------------
    // Generate pairing code
    // ----------------------------------------------------------

    const pairingCode = crypto.randomBytes(3).toString('hex').toUpperCase();

    // ----------------------------------------------------------
    // Create terminal
    // ----------------------------------------------------------

    return this.prisma.terminal.create({
      data: {
        name: dto.name,
        type: dto.type,
        restaurantId: dto.restaurantId,
        deviceModel: dto.deviceModel ?? null,

        pairingCode,
        isPaired: false,
        isActive: false,
      },

      select: {
        id: true,
        name: true,
        type: true,
        restaurantId: true,
        deviceModel: true,
        pairingCode: true,
        isPaired: true,
        isActive: true,
        lastPingAt: true,
        createdAt: true,
        updatedAt: true,

        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  // ============================================================
  // PAIR DEVICE
  // ============================================================

  async pairDevice(pairingCode: string, deviceModel?: string) {
    const terminal = await this.prisma.terminal.findUnique({
      where: {
        pairingCode,
      },
    });

    if (!terminal) {
      throw new NotFoundException('Invalid pairing code. Terminal not found.');
    }

    if (terminal.isPaired) {
      throw new ConflictException('This terminal has already been paired.');
    }

    return this.prisma.terminal.update({
      where: {
        id: terminal.id,
      },

      data: {
        isPaired: true,
        isActive: true,

        pairingCode: null,

        deviceModel: deviceModel ?? terminal.deviceModel,

        lastPingAt: new Date(),
      },

      select: {
        id: true,
        name: true,
        type: true,
        restaurantId: true,
        deviceModel: true,
        isPaired: true,
        isActive: true,
        lastPingAt: true,

        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  // ============================================================
  // HEARTBEAT / PING
  // ============================================================

  async ping(id: string) {
    const terminal = await this.findOne(id);

    if (!terminal.isPaired) {
      throw new BadRequestException('Terminal is not paired.');
    }

    if (!terminal.isActive) {
      throw new BadRequestException('Terminal has been deactivated.');
    }

    return this.prisma.terminal.update({
      where: {
        id,
      },

      data: {
        lastPingAt: new Date(),
      },

      select: {
        id: true,
        name: true,
        type: true,
        restaurantId: true,
        isPaired: true,
        isActive: true,
        lastPingAt: true,
      },
    });
  }

  // ============================================================
  // GET TERMINALS BY RESTAURANT
  // ============================================================

  async findByRestaurant(restaurantId: string) {
    return this.prisma.terminal.findMany({
      where: {
        restaurantId,
      },

      orderBy: {
        createdAt: 'desc',
      },

      select: {
        id: true,
        name: true,
        type: true,
        restaurantId: true,
        deviceModel: true,

        pairingCode: true,

        isPaired: true,
        isActive: true,

        lastPingAt: true,

        createdAt: true,
        updatedAt: true,
      },
    });
  }

  // ============================================================
  // GET ONE TERMINAL
  // ============================================================

  async findOne(id: string) {
    const terminal = await this.prisma.terminal.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        name: true,
        type: true,

        restaurantId: true,

        deviceModel: true,

        pairingCode: true,

        isPaired: true,
        isActive: true,

        lastPingAt: true,

        createdAt: true,
        updatedAt: true,

        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!terminal) {
      throw new NotFoundException(`Terminal with ID '${id}' not found.`);
    }

    return terminal;
  }

  // ============================================================
  // UPDATE
  // ============================================================

  async update(id: string, dto: UpdateTerminalDto) {
    const terminal = await this.findOne(id);

    // ----------------------------------------------------------
    // Check duplicate name
    // ----------------------------------------------------------

    if (dto.name && dto.name !== terminal.name) {
      const existing = await this.prisma.terminal.findFirst({
        where: {
          restaurantId: terminal.restaurantId,

          name: dto.name,

          NOT: {
            id,
          },
        },
      });

      if (existing) {
        throw new ConflictException(
          'A terminal with this name already exists in this restaurant.',
        );
      }
    }

    // ----------------------------------------------------------
    // Only update fields that administrators are allowed to edit
    // ----------------------------------------------------------

    return this.prisma.terminal.update({
      where: {
        id,
      },

      data: {
        ...(dto.name !== undefined && {
          name: dto.name,
        }),

        ...(dto.type !== undefined && {
          type: dto.type,
        }),

        ...(dto.deviceModel !== undefined && {
          deviceModel: dto.deviceModel,
        }),
      },

      select: {
        id: true,
        name: true,
        type: true,
        restaurantId: true,
        deviceModel: true,
        isPaired: true,
        isActive: true,
        lastPingAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  // ============================================================
  // UPDATE STATUS
  // ============================================================

  async updateStatus(id: string, dto: UpdateTerminalStatusDto) {
    await this.findOne(id);

    return this.prisma.terminal.update({
      where: {
        id,
      },

      data: {
        isActive: dto.isActive,
      },

      select: {
        id: true,
        name: true,
        type: true,
        restaurantId: true,
        isPaired: true,
        isActive: true,
        lastPingAt: true,
        updatedAt: true,
      },
    });
  }

  // ============================================================
  // DELETE
  // ============================================================

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.terminal.delete({
      where: {
        id,
      },
    });
  }
}
