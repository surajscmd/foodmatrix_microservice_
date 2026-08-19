import {
  IsString,
  IsOptional,
  IsNotEmpty,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateFranchiseDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2, {
    message: 'Franchise name must be at least 2 characters long',
  })
  @MaxLength(100, { message: 'Franchise name cannot exceed 100 characters' })
  name!: string;

  @IsString()
  @IsOptional()
  taxId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(3, { message: 'Currency must be a 3-letter ISO code (e.g., USD)' })
  defaultCurrency?: string;
}
