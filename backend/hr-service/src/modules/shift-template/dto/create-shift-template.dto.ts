import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { ShiftTemplateStatus, ShiftType } from '@prisma/client';

class ShiftTemplateSegmentDto {
  @IsInt()
  @Min(1)
  sequence!: number;

  @IsString()
  @IsNotEmpty()
  @Matches(/^(?:[01]\d|2[0-3]):[0-5]\d$/, {
    message: 'startTime must be in HH:mm format',
  })
  startTime!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^(?:[01]\d|2[0-3]):[0-5]\d$/, {
    message: 'endTime must be in HH:mm format',
  })
  endTime!: string;

  @IsBoolean()
  crossesMidnight!: boolean;
}

export class CreateShiftTemplateDto {
  @IsUUID()
  restaurantId!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(ShiftType)
  type!: ShiftType;

  @IsEnum(ShiftTemplateStatus)
  status?: ShiftTemplateStatus;

  @ValidateNested({ each: true })
  @Type(() => ShiftTemplateSegmentDto)
  segments!: ShiftTemplateSegmentDto[];
}
