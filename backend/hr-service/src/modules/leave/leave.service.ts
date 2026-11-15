import type { RestaurantFilter } from '../../auth/hr-access.js';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { LeaveStatus, Prisma } from '@prisma/client';

import { PrismaService } from '../../lib/prisma/prisma.service.js';

import { CreateLeaveDto } from './dto/create-leave.dto.js';
import type { RevokeLeaveDto } from './dto/revoke-leave.dto.js';
import type { AuthenticatedUser } from '../../auth/auth.types.js';
import { restaurantScope } from '../../auth/hr-access.js';
import { UpdateLeaveDto } from './dto/update-leave.dto.js';
import { KafkaProducerService } from '../kafka/kafka-producer.service.js';
import { inclusiveDays } from '../payroll/hr-dates.js';

@Injectable()
export class LeaveService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  async create(dto: CreateLeaveDto, user: AuthenticatedUser) {
    const { staffId, type, isPaidLeave, startDate, endDate, reason } = dto;
    const start = this.parseLeaveDay(startDate);
    const end = this.parseLeaveDay(endDate);
    this.validateDateRange(start, end);

    return this.prisma
      .$transaction(
        async (tx) => {
          const staff = await tx.staff.findFirst({
            where: {
              id: staffId,
              deletedAt: null,
              status: { not: 'TERMINATED' },
            },
            select: { restaurantId: true },
          });
          if (!staff)
            throw new NotFoundException('Active staff member not found');
          restaurantScope(user, staff.restaurantId);

          const overlap = await tx.leave.findFirst({
            where: {
              staffId,
              status: { in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] },
              startDate: { lte: end },
              endDate: { gte: start },
            },
            select: { id: true },
          });
          if (overlap)
            throw new ConflictException(
              'Staff already has a leave during this period',
            );

          const leave = await tx.leave.create({
            data: {
              staffId,
              restaurantId: staff.restaurantId,
              type,
              isPaidLeave,
              startDate: start,
              endDate: end,
              totalDays: inclusiveDays(start, end),
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
          await this.kafkaProducer.enqueue(tx, 'hr.leave-applied', {
            leaveId: leave.id,
            staffId,
            restaurantId: leave.restaurantId,
            type: leave.type,
            isPaidLeave: leave.isPaidLeave,
            startDate: leave.startDate.toISOString(),
            endDate: leave.endDate.toISOString(),
            totalDays: leave.totalDays?.toString() ?? '0',
          });
          return { message: 'Leave request created successfully', data: leave };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      )
      .catch(this.handleConcurrentChange);
  }

  async findAll(
    restaurantId?: RestaurantFilter,
    staffId?: string,
    status?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const parsedStatus = this.parseLeaveStatus(status);

    const where: Prisma.LeaveWhereInput = {
      ...(staffId ? { staffId } : {}),

      ...(parsedStatus
        ? {
            status: parsedStatus,
          }
        : {}),

      ...(restaurantId ? { restaurantId } : {}),

      /*
       * Return leave records that overlap the requested period.
       *
       * Leave:
       *   startDate <= requestedEnd
       *   AND
       *   endDate >= requestedStart
       */
      ...(startDate || endDate
        ? {
            ...(endDate
              ? {
                  startDate: {
                    lte: this.parseDate(endDate),
                  },
                }
              : {}),

            ...(startDate
              ? {
                  endDate: {
                    gte: this.parseDate(startDate),
                  },
                }
              : {}),
          }
        : {}),
    };

    const leaves = await this.prisma.leave.findMany({
      where,

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

  /**
   * Get a single leave request by ID.
   */
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

  /**
   * Update a pending leave request.
   *
   * When dates or staff are changed, the complete
   * resulting request is validated again.
   */
  async update(id: string, dto: UpdateLeaveDto) {
    const existing = await this.prisma.leave.findUnique({
      where: {
        id,
      },
    });

    if (!existing) {
      throw new NotFoundException('Leave not found');
    }

    // Only pending requests can be modified.
    if (existing.status !== LeaveStatus.PENDING) {
      throw new ConflictException('Only pending leave requests can be updated');
    }

    const staffId = dto.staffId ?? existing.staffId;

    const startDate = dto.startDate
      ? this.parseLeaveDay(dto.startDate)
      : existing.startDate;

    const endDate = dto.endDate
      ? this.parseLeaveDay(dto.endDate)
      : existing.endDate;

    this.validateDateRange(startDate, endDate);

    // -------------------------------------------------------
    // Validate staff
    // -------------------------------------------------------

    const staff = await this.prisma.staff.findFirst({
      where: {
        id: staffId,
        restaurantId: existing.restaurantId,
        deletedAt: null,
      },

      select: {
        id: true,
      },
    });

    if (!staff) {
      throw new NotFoundException('Active staff member not found');
    }

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
          in: [LeaveStatus.PENDING, LeaveStatus.APPROVED],
        },

        startDate: {
          lte: endDate,
        },

        endDate: {
          gte: startDate,
        },
      },

      select: {
        id: true,
      },
    });

    if (overlappingLeave) {
      throw new ConflictException(
        'Staff already has a leave during this period',
      );
    }

    // -------------------------------------------------------
    // Calculate duration
    // -------------------------------------------------------

    const totalDays = inclusiveDays(startDate, endDate);

    // -------------------------------------------------------
    // Update leave
    // -------------------------------------------------------

    const leave = await this.prisma.leave
      .update({
        where: {
          id,
          status: LeaveStatus.PENDING,
          updatedAt: existing.updatedAt,
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
            startDate: startDate,
          }),

          ...(dto.endDate !== undefined && {
            endDate: endDate,
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
              restaurantId: true,
            },
          },
        },
      })
      .catch(this.handleConcurrentChange);

    return {
      message: 'Leave updated successfully',
      data: leave,
    };
  }

  // =========================================================
  // APPROVE
  // =========================================================

  /**
   * Approve a pending leave request.
   */
  async approve(id: string, approvedById: string) {
    const approvedLeave = await this.prisma
      .$transaction(
        async (tx) => {
          const leave = await tx.leave.findUnique({
            where: {
              id,
            },

            select: {
              id: true,
              staffId: true,
              status: true,
              isPaidLeave: true,
              startDate: true,
              endDate: true,
              restaurantId: true,
            },
          });

          if (!leave) {
            throw new NotFoundException('Leave not found');
          }

          if (leave.status !== LeaveStatus.PENDING) {
            throw new ConflictException(
              'Only pending leave requests can be approved',
            );
          }

          // -------------------------------------------------------
          // Approve leave
          // -------------------------------------------------------

          if (leave.isPaidLeave) {
            const run = await tx.payrollRun.findFirst({
              where: {
                restaurantId: leave.restaurantId,
                periodStartDate: { lte: leave.endDate },
                periodEndDate: { gte: leave.startDate },
                payslips: { some: {} },
              },
              select: { status: true },
              orderBy: { status: 'desc' },
            });
            if (run) {
              throw new ConflictException(
                run.status === 'PAID'
                  ? 'This paid leave overlaps a paid payroll run. Its payroll records are locked.'
                  : 'Reopen the unpaid payroll run before approving this paid leave, then calculate payroll again.',
              );
            }
          }
          const updated = await tx.leave.update({
            where: {
              id,
              status: LeaveStatus.PENDING,
            },

            data: {
              status: LeaveStatus.APPROVED,
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
                  restaurantId: true,
                },
              },
            },
          });
          await this.enqueueDecision(tx, updated, 'APPROVED');
          return updated;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      )
      .catch(this.handleConcurrentChange);
    return {
      message: 'Leave approved successfully',
      data: approvedLeave,
    };
  }

  // =========================================================
  // REJECT
  // =========================================================

  /**
   * Reject a pending leave request.
   */
  async reject(id: string) {
    const leave = await this.prisma.leave.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        status: true,
      },
    });

    if (!leave) {
      throw new NotFoundException('Leave not found');
    }

    if (leave.status !== LeaveStatus.PENDING) {
      throw new ConflictException(
        'Only pending leave requests can be rejected',
      );
    }

    const rejectedLeave = await this.prisma
      .$transaction(async (tx) => {
        const updated = await tx.leave.update({
          where: { id, status: LeaveStatus.PENDING },
          data: { status: LeaveStatus.REJECTED },
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
        await this.enqueueDecision(tx, updated, 'REJECTED');
        return updated;
      })
      .catch(this.handleConcurrentChange);
    return {
      message: 'Leave rejected successfully',
      data: rejectedLeave,
    };
  }

  // =========================================================
  // DELETE
  // =========================================================

  async revoke(id: string, dto: RevokeLeaveDto, user: AuthenticatedUser) {
    const result = await this.prisma
      .$transaction(
        async (tx) => {
          const leave = await tx.leave.findUnique({
            where: { id },
          });
          if (!leave) throw new NotFoundException('Leave not found');
          restaurantScope(user, leave.restaurantId);

          if (leave.status === LeaveStatus.REVOKED) {
            return { message: 'Leave has already been revoked' };
          }
          if (
            leave.status !== dto.expectedStatus ||
            leave.updatedAt.getTime() !==
              new Date(dto.expectedUpdatedAt).getTime()
          ) {
            throw new ConflictException(
              'The leave request changed. Review the latest details before revoking it.',
            );
          }

          if (leave.status === LeaveStatus.APPROVED && leave.isPaidLeave) {
            const payslip = await tx.payslip.findFirst({
              where: {
                staffId: leave.staffId,
                payrollRun: {
                  restaurantId: leave.restaurantId,
                  periodStartDate: { lte: leave.endDate },
                  periodEndDate: { gte: leave.startDate },
                },
              },
              select: { payrollRun: { select: { status: true } } },
              orderBy: { payrollRun: { status: 'desc' } },
            });
            if (payslip) {
              throw new ConflictException(
                payslip.payrollRun.status === 'PAID'
                  ? 'This paid leave overlaps a paid payroll run. Its payroll records are locked.'
                  : 'Reopen the unpaid payroll run before revoking this paid leave, then calculate payroll again.',
              );
            }
          }

          await tx.leave.update({
            where: {
              id,
              status: dto.expectedStatus,
              updatedAt: leave.updatedAt,
            },
            data: {
              status: LeaveStatus.REVOKED,
              revokedById: user.systemUserId ?? user.id,
              revokedAt: new Date(),
              revokeReason: dto.reason,
            },
          });
          await this.enqueueDecision(tx, leave, 'REVOKED');
          return { message: 'Leave revoked' };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      )
      .catch(this.handleConcurrentChange);
    return result;
  }

  private async enqueueDecision(
    tx: Prisma.TransactionClient,
    leave: { id: string; restaurantId: string; startDate: Date; endDate: Date },
    status: 'APPROVED' | 'REJECTED' | 'REVOKED',
  ) {
    await this.kafkaProducer.enqueue(tx, 'hr.leave-decision', {
      leaveId: leave.id,
      restaurantId: leave.restaurantId,
      status,
      startDate: leave.startDate.toISOString().slice(0, 10),
      endDate: leave.endDate.toISOString().slice(0, 10),
    });
  }

  /** Delete a pending leave request. */
  async remove(id: string) {
    const leave = await this.prisma.leave.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        status: true,
      },
    });

    if (!leave) {
      throw new NotFoundException('Leave not found');
    }

    // Approved/rejected requests should remain as records.
    if (leave.status !== LeaveStatus.PENDING) {
      throw new ConflictException('Only pending leave requests can be deleted');
    }

    const removed = await this.prisma.leave.deleteMany({
      where: {
        id,
        status: LeaveStatus.PENDING,
      },
    });
    if (!removed.count) {
      throw new ConflictException(
        'The leave request was already updated. Refresh and try again.',
      );
    }

    return {
      message: 'Leave deleted successfully',
    };
  }

  private handleConcurrentChange(this: void, error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === 'P2025' || error.code === 'P2034')
    ) {
      throw new ConflictException(
        'The leave request changed. Refresh and try again.',
      );
    }
    throw error;
  }

  // =========================================================
  // HELPERS
  // =========================================================

  /**
   * Convert an incoming date string into a valid Date.
   */
  private parseDate(value: string): Date {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`Invalid date: ${value}`);
    }

    return date;
  }

  private parseLeaveDay(value: string): Date {
    const date = this.parseDate(value);
    date.setUTCHours(0, 0, 0, 0);
    return date;
  }

  /**
   * Validate that the leave date range is valid.
   */
  private validateDateRange(startDate: Date, endDate: Date): void {
    if (startDate.getTime() > endDate.getTime()) {
      throw new BadRequestException('Start date cannot be after end date');
    }
  }

  /**
   * Convert and validate the leave status
   * supplied through query parameters.
   */
  private parseLeaveStatus(status?: string): LeaveStatus | undefined {
    if (!status) {
      return undefined;
    }

    if (!Object.values(LeaveStatus).includes(status as LeaveStatus)) {
      throw new BadRequestException(`Invalid leave status: ${status}`);
    }

    return status as LeaveStatus;
  }
}
