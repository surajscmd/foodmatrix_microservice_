import { IsBoolean, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateRestaurantMenuItemDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}
