import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateRestaurantDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsString()
  @MinLength(2)
  address!: string;

  @IsString()
  @MinLength(2)
  city!: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsString()
  @MinLength(2)
  country!: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsUUID(4, {
    message: 'regionId must be a valid UUID',
  })
  regionId!: string;
}
