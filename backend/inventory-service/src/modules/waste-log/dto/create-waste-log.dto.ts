import { IsNumber, IsString, IsUUID, MaxLength, Min } from 'class-validator';

import { Type } from 'class-transformer';

export class CreateWasteLogDto {
  @IsUUID('4')
  restaurantId: string;

  @IsUUID('4')
  ingredientId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.0001)
  qty: number;

  @IsString()
  @MaxLength(255)
  reason: string;
}
