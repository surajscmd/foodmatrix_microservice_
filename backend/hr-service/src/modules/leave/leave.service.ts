import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../lib/prisma/prisma.service.js';

import { CreateLeaveDto } from './dto/create-leave.dto.js';
import { UpdateLeaveDto } from './dto/update-leave.dto.js';

@Injectable()
export class LeaveService {
  constructor(private readonly prisma: PrismaService) {}

  // =========================================================
  // CREATE
  // =========================================================

  async create(dto: CreateLeaveDto) {
    const { staffId, type, isPaidLeave, startDate, endDate, reason } = dto;

    // -------------------------------------------------------
    // Check staff exists
    // -------------------------------------------------------

    const staff = await this.prisma.staff.findUnique({
      where: {
        id: staffId,
      },
    });

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    // -------------------------------------------------------
    // Validate dates
    // -------------------------------------------------------

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      throw new ConflictException('Start date cannot be after end date');
    }

    // -------------------------------------------------------
    // Check overlapping leave
    // -------------------------------------------------------

    const overlappingLeave = await this.prisma.leave.findFirst({
      where: {
        staffId,
        status: {
          in: ['PENDING', 'APPROVED'],
        },
        startDate: {
          lte: end,
        },
        endDate: {
          gte: start,
        },
      },
    });

    if (overlappingLeave) {
      throw new ConflictException(
        'Staff already has a leave during this period',
      );
    }

    // -------------------------------------------------------
    // Calculate total days
    // -------------------------------------------------------

    const totalDays =
      Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // -------------------------------------------------------
    // Create leave
    // -------------------------------------------------------

    const leave = await this.prisma.leave.create({
      data: {
        staffId,
        type,
        isPaidLeave,
        startDate: start,
        endDate: end,
        totalDays,
        reason,
      },
      include: {
        staff: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    return {
      message: 'Leave request created successfully',
      data: leave,
    };
  }

  // =========================================================
  // FIND ALL
  // =========================================================

  async findAll(restaurantId?: string, staffId?: string, status?: string) {
    const leaves = await this.prisma.leave.findMany({
      where: {
        ...(staffId && {
          staffId,
        }),

        ...(status && {
          status: status as 'PENDING' | 'APPROVED' | 'REJECTED',
        }),

        ...(restaurantId && {
          staff: {
            restaurantId,
          },
        }),
      },

      include: {
        staff: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            role: true,
            restaurantId: true,
          },
        },
      },

      orderBy: {
        startDate: 'desc',
      },
    });

    return {
      message: 'Leaves fetched successfully',
      data: leaves,
    };
  }

  // =========================================================
  // FIND ONE
  // =========================================================

  async findOne(id: string) {
    const leave = await this.prisma.leave.findUnique({
      where: {
        id,
      },

      include: {
        staff: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            role: true,
            restaurantId: true,
          },
        },
      },
    });

    if (!leave) {
      throw new NotFoundException('Leave not found');
    }

    return {
      message: 'Leave fetched successfully',
      data: leave,
    };
  }

  // =========================================================
  // UPDATE
  // =========================================================

  async update(id: string, dto: UpdateLeaveDto) {
    const existing = await this.prisma.leave.findUnique({
      where: {
        id,
      },
    });

    if (!existing) {
      throw new NotFoundException('Leave not found');
    }

    if (existing.status !== 'PENDING') {
      throw new ConflictException('Only pending leave requests can be updated');
    }

    const startDate = dto.startDate
      ? new Date(dto.startDate)
      : existing.startDate;

    const endDate = dto.endDate ? new Date(dto.endDate) : existing.endDate;

    if (startDate > endDate) {
      throw new ConflictException('Start date cannot be after end date');
    }

    const staffId = dto.staffId ?? existing.staffId;

    // -------------------------------------------------------
    // Check overlapping leave
    // -------------------------------------------------------

    const overlappingLeave = await this.prisma.leave.findFirst({
      where: {
        id: {
          not: id,
        },

        staffId,

        status: {
          in: ['PENDING', 'APPROVED'],
        },

        startDate: {
          lte: endDate,
        },

        endDate: {
          gte: startDate,
        },
      },
    });

    if (overlappingLeave) {
      throw new ConflictException(
        'Staff already has a leave during this period',
      );
    }

    const totalDays =
      Math.floor(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1;

    const leave = await this.prisma.leave.update({
      where: {
        id,
      },

      data: {
        ...(dto.staffId !== undefined && {
          staffId: dto.staffId,
        }),

        ...(dto.type !== undefined && {
          type: dto.type,
        }),

        ...(dto.isPaidLeave !== undefined && {
          isPaidLeave: dto.isPaidLeave,
        }),

        ...(dto.startDate !== undefined && {
          startDate,
        }),

        ...(dto.endDate !== undefined && {
          endDate,
        }),

        ...(dto.reason !== undefined && {
          reason: dto.reason,
        }),

        totalDays,
      },

      include: {
        staff: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    return {
      message: 'Leave updated successfully',
      data: leave,
    };
  }

  // =========================================================
  // APPROVE
  // =========================================================

  async approve(id: string, approvedById: string) {
    const leave = await this.prisma.leave.findUnique({
      where: {
        id,
      },
    });

    if (!leave) {
      throw new NotFoundException('Leave not found');
    }

    if (leave.status !== 'PENDING') {
      throw new ConflictException(
        'Only pending leave requests can be approved',
      );
    }

    const approvedLeave = await this.prisma.leave.update({
      where: {
        id,
      },

      data: {
        status: 'APPROVED',
        approvedById,
        approvedAt: new Date(),
      },

      include: {
        staff: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    return {
      message: 'Leave approved successfully',
      data: approvedLeave,
    };
  }

  // =========================================================
  // REJECT
  // =========================================================

  async reject(id: string) {
    const leave = await this.prisma.leave.findUnique({
      where: {
        id,
      },
    });

    if (!leave) {
      throw new NotFoundException('Leave not found');
    }

    if (leave.status !== 'PENDING') {
      throw new ConflictException(
        'Only pending leave requests can be rejected',
      );
    }

    const rejectedLeave = await this.prisma.leave.update({
      where: {
        id,
      },

      data: {
        status: 'REJECTED',
      },

      include: {
        staff: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    return {
      message: 'Leave rejected successfully',
      data: rejectedLeave,
    };
  }

  // =========================================================
  // DELETE
  // =========================================================

  async remove(id: string) {
    const leave = await this.prisma.leave.findUnique({
      where: {
        id,
      },
    });

    if (!leave) {
      throw new NotFoundException('Leave not found');
    }

    if (leave.status !== 'PENDING') {
      throw new ConflictException('Only pending leave requests can be deleted');
    }

    await this.prisma.leave.delete({
      where: {
        id,
      },
    });

    return {
      message: 'Leave deleted successfully',
    };
  }
}
