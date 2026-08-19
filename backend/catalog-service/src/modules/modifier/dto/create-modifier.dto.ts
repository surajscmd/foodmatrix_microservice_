import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';

export class CreateModifierDto {
  @IsUUID()
  groupId!: string;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsInt()
  @Min(0)
  sortOrder: number = 0;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  extraPrice: number = 0;

  @IsBoolean()
  isActive: boolean = true;
}
