import { IsOptional, IsString, Length, ValidateIf } from 'class-validator';
import { IsSupportedCurrency } from '../../organization-settings.validation.js';

export class UpdateFranchiseDto {
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @Length(2, 100)
  name?: string;

  @IsOptional()
  @IsString()
  taxId?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsSupportedCurrency()
  defaultCurrency?: string;
}
