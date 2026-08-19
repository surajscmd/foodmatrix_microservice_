import {
  IsBoolean,
  IsInt,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class CreateModifierGroupDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsInt()
  @Min(0)
  sortOrder: number = 0;

  @IsInt()
  @Min(0)
  minSelections: number = 0;

  @IsInt()
  @Min(1)
  @Max(100)
  maxSelections: number = 1;

  @IsBoolean()
  isActive: boolean = true;
}
