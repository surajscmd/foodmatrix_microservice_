import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

import { SystemUserRole } from '@prisma/client';

export class RegisterDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsEnum(SystemUserRole)
  role!: SystemUserRole;

  @IsOptional()
  @IsUUID()
  managedRestaurantId?: string;

  @IsOptional()
  @IsUUID()
  franchiseId?: string;
}
