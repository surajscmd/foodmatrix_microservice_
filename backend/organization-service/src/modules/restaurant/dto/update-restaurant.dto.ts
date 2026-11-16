import {
  IsEnum,
  IsOptional,
  IsString,
  Length,
  ValidateIf,
} from 'class-validator';

import { RestaurantStatus } from '@prisma/client';
import { IsSupportedTimeZone } from '../../organization-settings.validation.js';

export class UpdateRestaurantDto {
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @Length(2, 100)
  name?: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @Length(2, 255)
  address?: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @Length(2, 100)
  city?: string;

  @IsOptional()
  @IsString()
  @Length(2, 100)
  state?: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @Length(2, 100)
  country?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsSupportedTimeZone()
  timezone?: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsEnum(RestaurantStatus)
  status?: RestaurantStatus;
}
