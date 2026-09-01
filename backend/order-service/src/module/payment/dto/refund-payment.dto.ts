import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class RefundPaymentDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason?: string;
}
