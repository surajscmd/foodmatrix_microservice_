import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

import { PayType } from '@prisma/client';

export class CreateWageDto {
  @IsUUID('4')
  staffId!: string;

  @IsEnum(PayType)
  payType!: PayType;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999.99)
  hourlyWage?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999.99)
  overtimeRate?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99999999.99)
  salaryAmount?: number;

  @IsDateString()
  effectiveStartDate!: string;

  @IsOptional()
  @IsDateString()
  effectiveEndDate?: string;

  @IsOptional()
  @IsUUID('4')
  approvedById?: string;
}
