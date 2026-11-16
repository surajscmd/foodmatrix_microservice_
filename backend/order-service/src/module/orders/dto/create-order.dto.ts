import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { MAX_ORDER_QUANTITY } from '../../../utils/order-item.util';
import { Type } from 'class-transformer';

import { OrderType } from '@prisma/client';

export class CreateOrderModifierDto {
  @IsUUID()
  modifierId: string;

  @IsInt()
  @Min(1)
  @Max(MAX_ORDER_QUANTITY)
  quantity: number = 1;
}

export class CreateOrderItemDto {
  @IsUUID()
  menuItemId: string;

  @IsInt()
  @Min(1)
  @Max(MAX_ORDER_QUANTITY)
  quantity: number = 1;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderModifierDto)
  modifiers?: CreateOrderModifierDto[];
}

export class CreateOrderDto {
  @IsUUID()
  restaurantId: string;

  @IsString()
  @Matches(/^[0-9+\-\s]{7,20}$/, {
    message: 'Invalid phone number.',
  })
  phone: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name?: string;

  @IsEnum(OrderType)
  type: OrderType;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  tableId?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
