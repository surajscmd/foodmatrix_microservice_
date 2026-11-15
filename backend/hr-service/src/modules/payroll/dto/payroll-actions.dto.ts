import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsISO8601,
  IsNumber,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { PaymentMethod } from '@prisma/client';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class PayrollVersionDto {
  @IsISO8601({ strict: true, strictSeparator: true })
  expectedUpdatedAt!: string;
}

export class ReopenPayrollDto extends PayrollVersionDto {
  @Transform(trim)
  @IsString()
  @Length(1, 500)
  reason!: string;
}

export class RecordPayrollPaymentDto extends PayrollVersionDto {
  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @Transform(trim)
  @IsString()
  @Length(1, 150)
  reference!: string;
}

export class PayrollDeductionsDto extends PayrollVersionDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99999999.99)
  taxDeductions!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99999999.99)
  otherDeductions!: number;
}
