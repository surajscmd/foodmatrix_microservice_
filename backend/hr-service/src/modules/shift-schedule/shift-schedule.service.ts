import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../lib/prisma/prisma.service.js';

import { CreateShiftScheduleDto } from './dto/create-shift-schedule.dto.js';
import { UpdateShiftScheduleDto } from './dto/update-shift-schedule.dto.js';

@Injectable()
export class ShiftScheduleService {
  constructor(private readonly prisma: PrismaService) {}

  // =====================================================
  // CREATE
  // =====================================================

  async create(dto: CreateShiftScheduleDto) {
    const {
      restaurantId,
      staffId,
      shiftTemplateId,
      scheduledStart,
      scheduledEnd,
    } = dto;

    const start = new Date(scheduledStart);
    const end = new Date(scheduledEnd);

    // -------------------------------------------------
    // Validate dates
    // -------------------------------------------------

    if (start >= end) {
      throw new ConflictException(
        'Scheduled start must be before scheduled end',
      );
    }

    // -------------------------------------------------
    // Validate staff
    // -------------------------------------------------

    const staff = await this.prisma.staff.findFirst({
      where: {
        id: staffId,
        restaurantId,
        deletedAt: null,
      },
    });

    if (!staff) {
      throw new NotFoundException('Staff not found for this restaurant');
    }

    // -------------------------------------------------
    // Validate shift template
    // -------------------------------------------------

    const template = await this.prisma.shiftTemplate.findFirst({
      where: {
        id: shiftTemplateId,
        restaurantId,
        status: 'ACTIVE',
      },
    });

    if (!template) {
      throw new NotFoundException(
        'Shift template not found for this restaurant',
      );
    }

    // -------------------------------------------------
    // Check overlapping schedule
    // -------------------------------------------------

    const overlapping = await this.prisma.shiftSchedule.findFirst({
      where: {
        staffId,

        status: {
          not: 'CANCELLED',
        },

        scheduledStart: {
          lt: end,
        },

        scheduledEnd: {
          gt: start,
        },
      },
    });

    if (overlapping) {
      throw new ConflictException('Staff already has an overlapping shift');
    }

    // -------------------------------------------------
    // Create schedule
    // -------------------------------------------------

    const schedule = await this.prisma.shiftSchedule.create({
      data: {
        restaurantId,
        staffId,
        shiftTemplateId,
        scheduledStart: start,
        scheduledEnd: end,
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

        shiftTemplate: {
          include: {
            segments: {
              orderBy: {
                sequence: 'asc',
              },
            },
          },
        },
      },
    });

    return {
      message: 'Shift scheduled successfully',
      data: schedule,
    };
  }

  // =====================================================
  // FIND ALL
  // =====================================================

  async findAll(restaurantId?: string, staffId?: string) {
    const schedules = await this.prisma.shiftSchedule.findMany({
      where: {
        ...(restaurantId && { restaurantId }),
        ...(staffId && { staffId }),
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

        shiftTemplate: {
          include: {
            segments: {
              orderBy: {
                sequence: 'asc',
              },
            },
          },
        },
      },

      orderBy: {
        scheduledStart: 'asc',
      },
    });

    return {
      message: 'Shift schedules fetched successfully',
      data: schedules,
    };
  }

  // =====================================================
  // FIND ONE
  // =====================================================

  async findOne(id: string) {
    const schedule = await this.prisma.shiftSchedule.findUnique({
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
          },
        },

        shiftTemplate: {
          include: {
            segments: {
              orderBy: {
                sequence: 'asc',
              },
            },
          },
        },
      },
    });

    if (!schedule) {
      throw new NotFoundException('Shift schedule not found');
    }

    return {
      message: 'Shift schedule fetched successfully',
      data: schedule,
    };
  }

  // =====================================================
  // UPDATE
  // =====================================================

  async update(id: string, dto: UpdateShiftScheduleDto) {
    const existing = await this.prisma.shiftSchedule.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Shift schedule not found');
    }

    const restaurantId = dto.restaurantId ?? existing.restaurantId;

    const staffId = dto.staffId ?? existing.staffId;

    const shiftTemplateId = dto.shiftTemplateId ?? existing.shiftTemplateId;

    const start = dto.scheduledStart
      ? new Date(dto.scheduledStart)
      : existing.scheduledStart;

    const end = dto.scheduledEnd
      ? new Date(dto.scheduledEnd)
      : existing.scheduledEnd;

    if (start >= end) {
      throw new ConflictException(
        'Scheduled start must be before scheduled end',
      );
    }

    // -------------------------------------------------
    // Validate staff
    // -------------------------------------------------

    const staff = await this.prisma.staff.findFirst({
      where: {
        id: staffId,
        restaurantId,
        deletedAt: null,
      },
    });

    if (!staff) {
      throw new NotFoundException('Staff not found for this restaurant');
    }

    // -------------------------------------------------
    // Validate template
    // -------------------------------------------------

    const template = await this.prisma.shiftTemplate.findFirst({
      where: {
        id: shiftTemplateId,
        restaurantId,
        status: 'ACTIVE',
      },
    });

    if (!template) {
      throw new NotFoundException(
        'Shift template not found for this restaurant',
      );
    }

    // -------------------------------------------------
    // Check overlap excluding current schedule
    // -------------------------------------------------

    const overlapping = await this.prisma.shiftSchedule.findFirst({
      where: {
        id: {
          not: id,
        },

        staffId,

        status: {
          not: 'CANCELLED',
        },

        scheduledStart: {
          lt: end,
        },

        scheduledEnd: {
          gt: start,
        },
      },
    });

    if (overlapping) {
      throw new ConflictException('Staff already has an overlapping shift');
    }

    const schedule = await this.prisma.shiftSchedule.update({
      where: {
        id,
      },

      data: {
        restaurantId,
        staffId,
        shiftTemplateId,
        scheduledStart: start,
        scheduledEnd: end,
      },

      include: {
        staff: true,

        shiftTemplate: {
          include: {
            segments: {
              orderBy: {
                sequence: 'asc',
              },
            },
          },
        },
      },
    });

    return {
      message: 'Shift schedule updated successfully',
      data: schedule,
    };
  }

  // =====================================================
  // DELETE
  // =====================================================

  async remove(id: string) {
    const existing = await this.prisma.shiftSchedule.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Shift schedule not found');
    }

    await this.prisma.shiftSchedule.delete({
      where: {
        id,
      },
    });

    return {
      message: 'Shift schedule deleted successfully',
    };
  }
}
