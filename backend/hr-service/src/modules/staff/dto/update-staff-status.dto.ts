import { IsEnum, IsNotEmpty } from 'class-validator';

import { EmployeeStatus } from '@prisma/client';

export class UpdateStaffStatusDto {
  @IsEnum(EmployeeStatus)
  @IsNotEmpty()
  status!: EmployeeStatus;
}
