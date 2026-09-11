import { IsOptional, IsString, IsUUID, Length, Matches } from 'class-validator';

export class UpdateStaffDto {
  @IsOptional()
  @IsUUID('4')
  restaurantId?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  employeeCode?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  lastName?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  role?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4,6}$/, {
    message: 'PIN must be 4 to 6 digits',
  })
  pin?: string;
}
