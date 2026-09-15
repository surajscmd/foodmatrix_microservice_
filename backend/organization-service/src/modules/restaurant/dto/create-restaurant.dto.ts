import { IsEnum, IsOptional, IsString, IsUUID, Length } from 'class-validator';

import { RestaurantStatus } from '@prisma/client';

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

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsEnum(RestaurantStatus)
  status?: RestaurantStatus;

  @IsUUID()
  franchiseId!: string;
}
