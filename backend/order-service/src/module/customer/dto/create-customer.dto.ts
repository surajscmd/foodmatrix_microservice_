import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class CreateCustomerDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 20)
  phone!: string;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  name?: string;
}
