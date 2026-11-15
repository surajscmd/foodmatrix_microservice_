import { IsString, IsUUID, Length, Matches, ValidateIf } from 'class-validator';

export class UpdateStaffDto {
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsUUID('4')
  restaurantId?: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @Length(1, 50)
  employeeCode?: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @Length(1, 100)
  firstName?: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @Length(1, 100)
  lastName?: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @Length(1, 100)
  role?: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @Matches(/^\d{4,6}$/, {
    message: 'PIN must be 4 to 6 digits',
  })
  pin?: string;
}
