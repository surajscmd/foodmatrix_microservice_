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

export class ReceiveTransferItemDto {
  @IsUUID()
  transferItemId: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  receivedQty: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class ReceiveTransferDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReceiveTransferItemDto)
  items: ReceiveTransferItemDto[];
}