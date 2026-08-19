import { IsBoolean } from 'class-validator';

export class UpdateSystemUserStatusDto {
  @IsBoolean()
  isActive!: boolean;
}
