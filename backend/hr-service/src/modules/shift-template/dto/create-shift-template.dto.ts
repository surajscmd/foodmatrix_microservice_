import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
  ValidateNested,
  IsInt,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ShiftType } from '@prisma/client';

export class ShiftTemplateSegmentDto {
  @IsInt()
  @Min(1)
  sequence!: number;

  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'startTime must be in HH:mm format',
  })
  startTime!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'endTime must be in HH:mm format',
  })
  endTime!: string;

  @IsBoolean()
  crossesMidnight!: boolean;
}

export class CreateShiftTemplateDto {
  @IsString()
  @IsNotEmpty()
  restaurantId!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(ShiftType)
  type!: ShiftType;

  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ShiftTemplateSegmentDto)
  segments!: ShiftTemplateSegmentDto[];
}
