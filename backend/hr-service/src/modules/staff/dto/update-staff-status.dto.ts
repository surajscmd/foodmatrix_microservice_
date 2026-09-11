import { IsEnum } from 'class-validator';
import { EmployeeStatus } from '@prisma/client';

export class UpdateStaffStatusDto {
  @IsEnum(EmployeeStatus)
  status!: EmployeeStatus;
}
