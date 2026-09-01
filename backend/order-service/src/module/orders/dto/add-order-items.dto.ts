import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AddOrderItemModifierDto {
  @IsUUID()
  modifierId: string;

  @IsInt()
  @Min(1)
  quantity: number = 1;
}

export class AddOrderItemDto {
  @IsUUID()
  menuItemId: string;

  @IsInt()
  @Min(1)
  quantity: number = 1;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddOrderItemModifierDto)
  modifiers?: AddOrderItemModifierDto[];
}

export class AddOrderItemsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AddOrderItemDto)
  items: AddOrderItemDto[];
}
