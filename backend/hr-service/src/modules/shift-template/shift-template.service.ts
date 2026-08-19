import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { CreateShiftTemplateDto } from './dto/create-shift-template.dto.js';
import { UpdateShiftTemplateDto } from './dto/update-shift-template.dto.js';
import { PrismaService } from '../../lib/prisma/prisma.service.js';

// Extracted for strict typing across the service
export interface SegmentInput {
  sequence: number;
  startTime: string;
  endTime: string;
  crossesMidnight: boolean;
}

@Injectable()
export class ShiftTemplateService {
  constructor(private readonly prisma: PrismaService) {}

  // ======================================================
  // CREATE
  // ======================================================

  async create(dto: CreateShiftTemplateDto) {
    const { restaurantId, name, type, segments } = dto;

    const existing = await this.prisma.shiftTemplate.findUnique({
      where: {
        restaurantId_name: {
          restaurantId,
          name,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        'Shift template with this name already exists for this restaurant',
      );
    }

    this.validateSegments(segments);

    const template = await this.prisma.shiftTemplate.create({
      data: {
        restaurantId,
        name,
        type,
        segments: {
          create: segments.map((segment: SegmentInput) => ({
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

  // ======================================================
  // FIND ALL
  // ======================================================

  async findAll(restaurantId?: string) {
    // Strictly typed where clause prevents Prisma inference errors
    const whereCondition: Prisma.ShiftTemplateWhereInput = restaurantId
      ? { restaurantId }
      : {};

    const templates = await this.prisma.shiftTemplate.findMany({
      where: whereCondition,
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

  // ======================================================
  // FIND ONE
  // ======================================================

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

  // ======================================================
  // UPDATE
  // ======================================================

  async update(id: string, dto: UpdateShiftTemplateDto) {
    const existing = await this.prisma.shiftTemplate.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Shift template not found');
    }

    const { restaurantId, name, type, segments } = dto;

    if (segments) {
      this.validateSegments(segments);
    }

    // -----------------------------------------------
    // Check duplicate name
    // -----------------------------------------------

    if (name !== undefined) {
      const duplicate = await this.prisma.shiftTemplate.findFirst({
        where: {
          // Fallback strictly typed as string via Prisma constraints
          restaurantId: restaurantId ?? existing.restaurantId,
          name,
          NOT: { id },
        },
      });

      if (duplicate) {
        throw new ConflictException(
          'Shift template with this name already exists',
        );
      }
    }

    // -----------------------------------------------
    // Transaction
    // -----------------------------------------------

    const template = await this.prisma.$transaction(async (tx) => {
      await tx.shiftTemplate.update({
        where: { id },
        data: {
          ...(restaurantId !== undefined && { restaurantId }),
          ...(name !== undefined && { name }),
          ...(type !== undefined && { type }),
        },
      });

      // -----------------------------------------
      // Replace segments if supplied
      // -----------------------------------------

      if (segments !== undefined) {
        await tx.shiftTemplateSegment.deleteMany({
          where: { shiftTemplateId: id },
        });

        await tx.shiftTemplateSegment.createMany({
          data: segments.map((segment: SegmentInput) => ({
            shiftTemplateId: id,
            sequence: segment.sequence,
            startTime: segment.startTime,
            endTime: segment.endTime,
            crossesMidnight: segment.crossesMidnight,
          })),
        });
      }

      // findUniqueOrThrow ensures TS knows this will never return null
      return tx.shiftTemplate.findUniqueOrThrow({
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

  // ======================================================
  // DELETE
  // ======================================================

  async remove(id: string) {
    const existing = await this.prisma.shiftTemplate.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Shift template not found');
    }

    const schedulesCount = await this.prisma.shiftSchedule.count({
      where: { shiftTemplateId: id },
    });

    if (schedulesCount > 0) {
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

  // ======================================================
  // VALIDATE SEGMENTS
  // ======================================================

  private validateSegments(segments: SegmentInput[]) {
    if (segments.length === 0) {
      throw new ConflictException('At least one shift segment is required');
    }

    const sequences = segments.map((segment) => segment.sequence);

    if (new Set(sequences).size !== sequences.length) {
      throw new ConflictException('Segment sequence numbers must be unique');
    }

    const sorted = [...segments].sort((a, b) => a.sequence - b.sequence);

    sorted.forEach((segment, index) => {
      if (segment.sequence !== index + 1) {
        throw new ConflictException(
          'Segment sequences must start at 1 and be consecutive',
        );
      }
    });
  }
}
