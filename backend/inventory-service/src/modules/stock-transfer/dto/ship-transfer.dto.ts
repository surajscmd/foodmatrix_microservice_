import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsPositive,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ShipTransferItemDto {
  @IsUUID()
  transferItemId: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  shippedQty: number;
}

export class ShipTransferDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ShipTransferItemDto)
  items: ShipTransferItemDto[];
}