import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EmployeeStatus, PayType, Prisma } from '@prisma/client';
import { hash } from 'bcrypt';
import { PrismaService } from '../../lib/prisma/prisma.service.js';
import { CreateStaffDto } from './dto/create-staff.dto.js';
import { UpdateStaffDto } from './dto/update-staff.dto.js';
import { CreateWageHistoryDto } from './dto/create-wage-history.dto.js';

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  // Centralized select object to prevent pinHash leakage
  private readonly safeStaffSelect: Prisma.StaffSelect = {
    id: true,
    restaurantId: true,
    employeeCode: true,
    firstName: true,
    lastName: true,
    role: true,
    status: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    wageHistories: {
      where: {
        effectiveEndDate: null,
      },
      take: 1,
    },
  };

  async create(createStaffDto: CreateStaffDto) {
    const {
      restaurantId,
      employeeCode,
      firstName,
      lastName,
      role,
      pin,
      payType,
      hourlyWage,
      overtimeRate,
      salaryAmount,
      approvedById,
    } = createStaffDto;

    const existingStaff = await this.prisma.staff.findUnique({
      where: {
        restaurantId_employeeCode: {
          restaurantId,
          employeeCode,
        },
      },
    });

    if (existingStaff) {
      throw new ConflictException(
        'Employee code already exists for this restaurant',
      );
    }

    // Explicitly typed to satisfy strict ESLint rules
    const pinHash: string = await hash(pin, 10);

    const staff = await this.prisma.staff.create({
      data: {
        restaurantId,
        employeeCode,
        firstName,
        lastName,
        role,
        pinHash,
        wageHistories: {
          create: {
            payType: payType || PayType.HOURLY,
            hourlyWage,
            overtimeRate,
            salaryAmount,
            effectiveStartDate: new Date(),
            approvedById,
          },
        },
      },
      select: this.safeStaffSelect,
    });

    return {
      message: 'Staff created successfully',
      data: staff,
    };
  }

  async findAll(restaurantId?: string) {
    const staff = await this.prisma.staff.findMany({
      where: {
        ...(restaurantId && { restaurantId }),
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: this.safeStaffSelect,
    });

    return staff;
  }

  async findOne(id: string) {
    const staff = await this.prisma.staff.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: this.safeStaffSelect,
    });

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    return {
      data: staff,
    };
  }

  async update(id: string, updateStaffDto: UpdateStaffDto) {
    // 1. Fetch current record
    const { data: currentStaff } = await this.findOne(id);

    const { pin, ...data } = updateStaffDto;

    // 2. Safely check for unique constraint collisions
    if (data.employeeCode || data.restaurantId) {
      // Removed the optional chaining (?.) and the (as string) assertions
      const targetRestaurantId: string =
        data.restaurantId ?? currentStaff.restaurantId;
      const targetEmployeeCode: string =
        data.employeeCode ?? currentStaff.employeeCode;

      const existingStaff = await this.prisma.staff.findUnique({
        where: {
          restaurantId_employeeCode: {
            restaurantId: targetRestaurantId,
            employeeCode: targetEmployeeCode,
          },
        },
      });

      if (existingStaff && existingStaff.id !== id) {
        throw new ConflictException(
          'Employee code already exists for this restaurant',
        );
      }
    }

    // 3. Prepare update payload
    const updateData: Prisma.StaffUpdateInput = {
      ...data,
    };

    if (pin) {
      const newPinHash: string = await hash(pin, 10);
      updateData.pinHash = newPinHash;
    }

    // 4. Execute update
    const staff = await this.prisma.staff.update({
      where: { id },
      data: updateData,
      select: this.safeStaffSelect,
    });

    return {
      staff,
    };
  }

  async updateStatus(id: string, status: EmployeeStatus) {
    await this.findOne(id);

    const staff = await this.prisma.staff.update({
      where: { id },
      data: {
        status,
      },
      select: this.safeStaffSelect,
    });

    return {
      message: 'Staff status updated successfully',
      data: staff,
    };
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.staff.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: EmployeeStatus.TERMINATED,
      },
    });

    return {
      message: 'Staff deleted successfully',
    };
  }
  // --- WAGE HISTORY MANAGEMENT ---

  async updateWage(id: string, dto: CreateWageHistoryDto) {
    // 1. Verify the employee exists using your existing method
    await this.findOne(id);

    // 2. Execute the transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const currentWage = await tx.wageHistory.findFirst({
        where: {
          staffId: id,
          effectiveEndDate: null,
        },
      });

      if (currentWage) {
        await tx.wageHistory.update({
          where: { id: currentWage.id },
          data: { effectiveEndDate: new Date() },
        });
      }

      const newWage = await tx.wageHistory.create({
        data: {
          staffId: id,
          payType: dto.payType,
          hourlyWage: dto.hourlyWage,
          overtimeRate: dto.overtimeRate,
          salaryAmount: dto.salaryAmount,
          effectiveStartDate: new Date(),
          approvedById: dto.approvedById,
        },
      });

      return newWage;
    });

    return {
      result,
    };
  }

  async getWageHistory(id: string) {
    // Verify employee exists
    await this.findOne(id);

    const history = await this.prisma.wageHistory.findMany({
      where: { staffId: id },
      orderBy: { effectiveStartDate: 'desc' },
    });

    return {
      message: 'Wage history fetched successfully',
      data: history,
    };
  }
}
