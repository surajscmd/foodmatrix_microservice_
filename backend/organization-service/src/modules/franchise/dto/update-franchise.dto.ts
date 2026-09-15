import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateFranchiseDto {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string;

  @IsOptional()
  @IsString()
  taxId?: string;

  @IsOptional()
  @IsString()
  defaultCurrency?: string;
}
