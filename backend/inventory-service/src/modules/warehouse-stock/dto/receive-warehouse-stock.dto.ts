import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  IsPositive,
  MaxLength,
} from 'class-validator';

import { Type } from 'class-transformer';

export class ReceiveWarehouseStockDto {
  @IsUUID()
  warehouseId: string;

  @IsUUID()
  ingredientId: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  referenceId?: string;
}
