import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsUUID,
  IsString,
} from 'class-validator';

export class CreateLeaveDto {
  @IsUUID()
  staffId!: string;

  @IsString()
  @IsNotEmpty()
  type!: string;

  @IsBoolean()
  isPaidLeave!: boolean;

  @IsDateString({ strict: true })
  startDate!: string;

  @IsDateString({ strict: true })
  endDate!: string;

  @IsString()
  @IsNotEmpty()
  reason!: string;
}
