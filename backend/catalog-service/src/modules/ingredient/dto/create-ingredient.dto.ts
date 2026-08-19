import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateIngredientDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  uom!: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
