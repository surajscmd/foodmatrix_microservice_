import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStockRequestItemDto {
  @IsUUID()
  ingredientId: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  requestedQty: number;
}

export class CreateStockRequestDto {
  @IsUUID()
  restaurantId: string;

  @IsUUID()
  warehouseId: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateStockRequestItemDto)
  items: CreateStockRequestItemDto[];
}
