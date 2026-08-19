import {
  IsString,
  IsUUID,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  IsInt,
  Min,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderType } from '@prisma/client';

export class CreateOrderItemModifierDto {
  @IsUUID()
  modifierId!: string;

  @IsString()
  name!: string;

  @IsNumber()
  @Min(0)
  price!: number;

  // NEW: Added modifier quantity
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateOrderItemDto {
  @IsUUID()
  menuItemId!: string;

  @IsString()
  name!: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemModifierDto)
  modifiers?: CreateOrderItemModifierDto[];
}

export class CreateOrderDto {
  @IsUUID()
  restaurantId!: string;

  @IsOptional()
  @IsUUID()
  staffId?: string;

  @IsOptional()
  @IsString()
  tableId?: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsEnum(OrderType)
  type: OrderType;

  // NEW: Allow client to pass a discount amount (which backend will verify later if needed)
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}
