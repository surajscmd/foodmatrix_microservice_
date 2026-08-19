import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

import { SystemUserRole } from '@prisma/client';

export class CreateSystemUserDto {
  @IsString()
  @MinLength(2)
  firstName!: string;

  @IsString()
  @MinLength(2)
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  authUserId!: string;

  @IsEnum(SystemUserRole, {
    message:
      'role must be SUPER_ADMIN, FRANCHISE_ADMIN, REGIONAL_ADMIN, or RESTAURANT_ADMIN',
  })
  role!:
    'SUPER_ADMIN' | 'FRANCHISE_ADMIN' | 'REGIONAL_ADMIN' | 'RESTAURANT_ADMIN';

  @IsOptional()
  @IsString()
  franchiseId?: string;

  @IsOptional()
  @IsString()
  managedRegionId?: string;

  @IsOptional()
  @IsString()
  managedRestaurantId?: string;
}
