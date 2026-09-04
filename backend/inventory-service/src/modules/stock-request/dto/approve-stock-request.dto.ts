import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsPositive,
  IsUUID,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

export class ApproveStockRequestItemDto {
  @IsUUID()
  ingredientId: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  approvedQty: number;
}

export class ApproveStockRequestDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ApproveStockRequestItemDto)
  items: ApproveStockRequestItemDto[];
}
