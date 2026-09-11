import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { PayType } from '@prisma/client';

export class CreateStaffDto {
  @IsUUID('4')
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
  @Matches(/^\d{4,6}$/, {
    message: 'PIN must be 4 to 6 digits',
  })
  pin!: string;

  @IsOptional()
  @IsEnum(PayType)
  payType?: PayType;

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
  @Max(9999999999.99)
  salaryAmount?: number;

  @IsOptional()
  @IsUUID('4')
  approvedById?: string;
}
