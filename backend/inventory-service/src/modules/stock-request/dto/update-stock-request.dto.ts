import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  IsPositive,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

export class UpdateStockRequestItemDto {
  @IsUUID('4')
  ingredientId: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  requestedQty: number;
}

export class UpdateStockRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpdateStockRequestItemDto)
  items: UpdateStockRequestItemDto[];
}
