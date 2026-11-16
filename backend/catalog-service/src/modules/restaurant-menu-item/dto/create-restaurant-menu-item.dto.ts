import {
  IsBoolean,
  IsNumber,
  IsUUID,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

export class CreateRestaurantMenuItemDto {
  @IsUUID()
  restaurantId!: string;

  @IsUUID()
  menuItemId!: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99_999_999.99)
  price?: number;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsBoolean()
  isAvailable?: boolean;
}
