import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ShiftTemplateStatus } from '@prisma/client';

import { PrismaService } from '../../lib/prisma/prisma.service.js';
import { CreateShiftTemplateDto } from './dto/create-shift-template.dto.js';
import { UpdateShiftTemplateDto } from './dto/update-shift-template.dto.js';

interface SegmentInput {
  sequence: number;
  startTime: string;
  endTime: string;
  crossesMidnight: boolean;
}

@Injectable()
export class ShiftTemplateService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a shift template with its segments.
   */
  async create(dto: CreateShiftTemplateDto) {
    // Template names must be unique within a restaurant.
    const existing = await this.prisma.shiftTemplate.findUnique({
      where: {
        restaurantId_name: {
          restaurantId: dto.restaurantId,
          name: dto.name,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        'A shift template with this name already exists for this restaurant',
      );
    }

    // Validate the complete segment definition before writing to the DB.
    this.validateSegments(dto.segments);

    const template = await this.prisma.shiftTemplate.create({
      data: {
        restaurantId: dto.restaurantId,
        name: dto.name,
        type: dto.type,
        status: dto.status ?? ShiftTemplateStatus.ACTIVE,

        segments: {
          create: dto.segments.map((segment) => ({
            sequence: segment.sequence,
            startTime: segment.startTime,
            endTime: segment.endTime,
            crossesMidnight: segment.crossesMidnight,
          })),
        },
      },

      include: {
        segments: {
          orderBy: {
            sequence: 'asc',
          },
        },
      },
    });

    return {
      message: 'Shift template created successfully',
      data: template,
    };
  }

  /**
   * Get shift templates with optional restaurant and status filters.
   */
  async findAll(restaurantId?: string, status?: string) {
    let parsedStatus: ShiftTemplateStatus | undefined;

    // Convert and validate the incoming query-string status.
    if (status) {
      if (
        !Object.values(ShiftTemplateStatus).includes(
          status as ShiftTemplateStatus,
        )
      ) {
        throw new BadRequestException(
          `Invalid shift template status: ${status}`,
        );
      }

      parsedStatus = status as ShiftTemplateStatus;
    }

    const templates = await this.prisma.shiftTemplate.findMany({
      where: {
        ...(restaurantId ? { restaurantId } : {}),

        ...(parsedStatus ? { status: parsedStatus } : {}),
      },

      include: {
        segments: {
          orderBy: {
            sequence: 'asc',
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      message: 'Shift templates fetched successfully',
      data: templates,
    };
  }

  /**
   * Get one shift template by ID.
   */
  async findOne(id: string) {
    const template = await this.prisma.shiftTemplate.findUnique({
      where: { id },

      include: {
        segments: {
          orderBy: {
            sequence: 'asc',
          },
        },
      },
    });

    if (!template) {
      throw new NotFoundException('Shift template not found');
    }

    return {
      message: 'Shift template fetched successfully',
      data: template,
    };
  }

  /**
   * Update a shift template and optionally replace its segments.
   */
  async update(id: string, dto: UpdateShiftTemplateDto) {
    const existing = await this.prisma.shiftTemplate.findUnique({
      where: { id },

      include: {
        _count: {
          select: {
            schedules: true,
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Shift template not found');
    }

    const hasSchedules = existing._count.schedules > 0;

    /*
     * A template already assigned to schedules must
     * remain associated with the same restaurant.
     */
    if (
      dto.restaurantId &&
      dto.restaurantId !== existing.restaurantId &&
      hasSchedules
    ) {
      throw new ConflictException(
        'Cannot change restaurant of a shift template that already has schedules',
      );
    }

    const targetRestaurantId = dto.restaurantId ?? existing.restaurantId;

    /*
     * Maintain the restaurant + template-name uniqueness rule.
     */
    if (
      dto.name &&
      (dto.name !== existing.name ||
        targetRestaurantId !== existing.restaurantId)
    ) {
      const duplicate = await this.prisma.shiftTemplate.findFirst({
        where: {
          restaurantId: targetRestaurantId,
          name: dto.name,

          NOT: {
            id,
          },
        },
      });

      if (duplicate) {
        throw new ConflictException(
          'A shift template with this name already exists for this restaurant',
        );
      }
    }

    // Validate new segments before starting the transaction.
    if (dto.segments) {
      this.validateSegments(dto.segments);
    }

    /*
     * Updating the template and its segments is handled
     * in one transaction so the template cannot be left
     * with partially updated segment data.
     */
    const template = await this.prisma.$transaction(async (tx) => {
      await tx.shiftTemplate.update({
        where: { id },

        data: {
          ...(dto.restaurantId !== undefined && {
            restaurantId: dto.restaurantId,
          }),

          ...(dto.name !== undefined && {
            name: dto.name,
          }),

          ...(dto.type !== undefined && {
            type: dto.type,
          }),

          ...(dto.status !== undefined && {
            status: dto.status,
          }),
        },
      });

      /*
       * Segments are treated as a complete definition.
       * When supplied, replace the existing segment set.
       */
      if (dto.segments) {
        await tx.shiftTemplateSegment.deleteMany({
          where: {
            shiftTemplateId: id,
          },
        });

        await tx.shiftTemplateSegment.createMany({
          data: dto.segments.map((segment) => ({
            shiftTemplateId: id,
            sequence: segment.sequence,
            startTime: segment.startTime,
            endTime: segment.endTime,
            crossesMidnight: segment.crossesMidnight,
          })),
        });
      }

      return tx.shiftTemplate.findUnique({
        where: { id },

        include: {
          segments: {
            orderBy: {
              sequence: 'asc',
            },
          },
        },
      });
    });

    return {
      message: 'Shift template updated successfully',
      data: template,
    };
  }

  /**
   * Delete a shift template.
   *
   * A template that has already been used by a schedule
   * must be preserved because schedules depend on it.
   */
  async remove(id: string) {
    const existing = await this.prisma.shiftTemplate.findUnique({
      where: { id },

      include: {
        _count: {
          select: {
            schedules: true,
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Shift template not found');
    }

    if (existing._count.schedules > 0) {
      throw new ConflictException(
        'Cannot delete a shift template that has schedules',
      );
    }

    await this.prisma.shiftTemplate.delete({
      where: { id },
    });

    return {
      message: 'Shift template deleted successfully',
    };
  }

  /**
   * Validate the segment structure of a shift template.
   */
  private validateSegments(segments: SegmentInput[]): void {
    if (!segments || segments.length === 0) {
      throw new BadRequestException('At least one shift segment is required');
    }

    const sequences = segments.map((segment) => segment.sequence);

    // Sequence numbers must be unique.
    if (new Set(sequences).size !== sequences.length) {
      throw new BadRequestException('Segment sequence numbers must be unique');
    }

    // Sort so the validation is independent of request order.
    const sortedSequences = [...sequences].sort((a, b) => a - b);

    /*
     * Segments must always be:
     * 1, 2, 3, 4...
     */
    sortedSequences.forEach((sequence, index) => {
      const expectedSequence = index + 1;

      if (sequence !== expectedSequence) {
        throw new BadRequestException(
          'Segment sequences must start at 1 and be consecutive',
        );
      }
    });

    for (const segment of segments) {
      if (!Number.isInteger(segment.sequence) || segment.sequence < 1) {
        throw new BadRequestException(
          'Segment sequence must be a positive integer',
        );
      }

      if (!this.isValidTime(segment.startTime)) {
        throw new BadRequestException(
          `Invalid startTime "${segment.startTime}". Use HH:mm format`,
        );
      }

      if (!this.isValidTime(segment.endTime)) {
        throw new BadRequestException(
          `Invalid endTime "${segment.endTime}". Use HH:mm format`,
        );
      }

      /*
       * Equal start/end times do not represent a valid segment.
       * Overnight shifts should instead use crossesMidnight=true.
       */
      if (segment.startTime === segment.endTime) {
        throw new BadRequestException(
          'Segment startTime and endTime cannot be the same',
        );
      }
    }
  }

  /**
   * Validate a 24-hour time in HH:mm format.
   */
  private isValidTime(value: string): boolean {
    return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
  }
}
