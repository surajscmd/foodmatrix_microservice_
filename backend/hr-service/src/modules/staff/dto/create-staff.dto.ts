import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
} from 'class-validator';

import { PayType } from '@prisma/client';

export class CreateStaffDto {
  @IsUUID()
  @IsNotEmpty()
  restaurantId!: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  employeeCode!: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  lastName!: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  role!: string;

  @IsString()
  @IsNotEmpty()
  @Length(4, 20)
  pin!: string;

  @IsEnum(PayType)
  @IsNotEmpty()
  payType!: PayType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyWage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  overtimeRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  salaryAmount?: number;

  @IsOptional()
  @IsUUID()
  approvedById?: string;
}
