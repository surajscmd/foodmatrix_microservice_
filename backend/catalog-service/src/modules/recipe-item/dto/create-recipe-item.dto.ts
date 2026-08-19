import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateRecipeItemDto {
  @IsOptional()
  @IsUUID()
  menuItemId?: string;

  @IsOptional()
  @IsUUID()
  modifierId?: string;

  @IsUUID()
  ingredientId!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  quantityNeeded!: number;
}
