import { IsDateString, IsNotEmpty, IsUUID } from 'class-validator';

export class CreatePayrollRunDto {
  @IsUUID()
  @IsNotEmpty()
  restaurantId!: string;

  @IsDateString()
  @IsNotEmpty()
  periodStartDate!: string;

  @IsDateString()
  @IsNotEmpty()
  periodEndDate!: string;

  @IsUUID()
  @IsNotEmpty()
  processedById!: string;
}
