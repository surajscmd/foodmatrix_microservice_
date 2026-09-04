import { IsNumber, IsString, MaxLength, NotEquals } from 'class-validator';

import { Type } from 'class-transformer';

export class AdjustStockDto {
  @Type(() => Number)
  @IsNumber()
  @NotEquals(0)
  quantityChange: number;

  @IsString()
  @MaxLength(255)
  reason: string;
}
