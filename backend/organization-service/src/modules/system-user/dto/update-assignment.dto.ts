import { SystemUserRole } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export class UpdateAssignmentDto {
  @IsEnum(SystemUserRole)
  role!: SystemUserRole;

  @IsUUID()
  franchiseId!: string;

  @IsOptional()
  @IsUUID()
  managedRestaurantId?: string | null;
}
