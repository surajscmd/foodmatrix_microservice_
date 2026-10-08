import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateModifierDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  groupId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  extraPrice?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
