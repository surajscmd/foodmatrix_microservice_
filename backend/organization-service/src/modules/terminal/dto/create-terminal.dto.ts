import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { TerminalType } from '@prisma/client';

export class CreateTerminalDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(TerminalType)
  @IsNotEmpty()
  type!: TerminalType;

  @IsUUID()
  @IsNotEmpty()
  restaurantId!: string;

  @IsString()
  @IsOptional()
  deviceModel?: string;
}
