import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

import { PaymentMethod } from '@prisma/client';

export class CreatePaymentDto {
  @IsUUID()
  orderId!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  transactionId?: string;
}
