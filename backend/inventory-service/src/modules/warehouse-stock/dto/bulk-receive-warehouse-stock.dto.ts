import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

export class BulkReceiveWarehouseStockItemDto {
  @IsUUID('4')
  ingredientId: string;

  @Type(() => Number)
  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  referenceId?: string;
}

export class BulkReceiveWarehouseStockDto {
  @IsUUID('4')
  warehouseId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BulkReceiveWarehouseStockItemDto)
  items: BulkReceiveWarehouseStockItemDto[];
}

