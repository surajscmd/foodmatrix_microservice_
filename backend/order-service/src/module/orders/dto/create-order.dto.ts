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
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { OrderType } from '@prisma/client';

export class CreateOrderModifierDto {
  @IsUUID()
  modifierId: string;

  @IsInt()
  @Min(1)
  quantity: number = 1;
}

export class CreateOrderItemDto {
  @IsUUID()
  menuItemId: string;

  @IsInt()
  @Min(1)
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
  name?: string;

  @IsEnum(OrderType)
  type: OrderType;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  tableId?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
