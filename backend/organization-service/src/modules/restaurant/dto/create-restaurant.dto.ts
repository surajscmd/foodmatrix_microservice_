import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  ValidateIf,
} from 'class-validator';

import { RestaurantStatus } from '@prisma/client';
import { IsSupportedTimeZone } from '../../organization-settings.validation.js';

export class CreateRestaurantDto {
  @IsString()
  @Length(2, 100)
  name!: string;

  @IsString()
  @Length(2, 255)
  address!: string;

  @IsString()
  @Length(2, 100)
  city!: string;

  @IsOptional()
  @IsString()
  @Length(2, 100)
  state?: string;

  @IsString()
  @Length(2, 100)
  country!: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsSupportedTimeZone()
  timezone?: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsEnum(RestaurantStatus)
  status?: RestaurantStatus;

  @IsUUID()
  franchiseId!: string;
}
