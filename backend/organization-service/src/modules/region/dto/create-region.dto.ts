import { IsString, IsUUID, MinLength, MaxLength } from 'class-validator';

export class CreateRegionDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsUUID(4, { message: 'franchiseId must be a valid UUID' })
  franchiseId!: string;
}
