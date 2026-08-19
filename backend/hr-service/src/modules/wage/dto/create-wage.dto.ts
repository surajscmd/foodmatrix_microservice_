import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';

import { PayType } from '@prisma/client';

export class CreateWageDto {
  @IsUUID()
  staffId!: string;

  @IsEnum(PayType)
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

  @IsDateString()
  effectiveStartDate!: string;

  @IsOptional()
  @IsDateString()
  effectiveEndDate?: string;

  @IsOptional()
  @IsUUID()
  approvedById?: string;
}
