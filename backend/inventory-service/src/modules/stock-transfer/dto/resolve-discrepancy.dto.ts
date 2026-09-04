import {
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ResolveDiscrepancyDto {
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  resolution: string;
}