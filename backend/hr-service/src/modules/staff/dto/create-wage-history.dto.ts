import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';

import { PayType } from '@prisma/client';

export class CreateWageHistoryDto {
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
