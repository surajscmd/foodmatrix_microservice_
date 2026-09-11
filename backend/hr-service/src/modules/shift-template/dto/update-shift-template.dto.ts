import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { ShiftTemplateStatus, ShiftType } from '@prisma/client';

class UpdateShiftTemplateSegmentDto {
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

export class UpdateShiftTemplateDto {
  @IsOptional()
  @IsUUID()
  restaurantId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsEnum(ShiftType)
  type?: ShiftType;

  @IsOptional()
  @IsEnum(ShiftTemplateStatus)
  status?: ShiftTemplateStatus;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateShiftTemplateSegmentDto)
  segments?: UpdateShiftTemplateSegmentDto[];
}
