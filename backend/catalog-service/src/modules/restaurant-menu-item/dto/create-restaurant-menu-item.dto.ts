import { IsBoolean, IsNumber, IsUUID, Min } from 'class-validator';

export class CreateRestaurantMenuItemDto {
  @IsUUID()
  restaurantId!: string;

  @IsUUID()
  menuItemId!: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsBoolean()
  isAvailable?: boolean;
}
