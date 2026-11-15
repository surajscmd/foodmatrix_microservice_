import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Matches,
} from 'class-validator';

export class CreatePayrollRunDto {
  @IsUUID()
  @IsNotEmpty()
  restaurantId!: string;

  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsNotEmpty()
  periodStartDate!: string;

  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsNotEmpty()
  periodEndDate!: string;

  @IsOptional()
  @IsUUID()
  processedById?: string;
}
