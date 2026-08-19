import { IsUUID } from 'class-validator';

export class ClockOutDto {
  @IsUUID()
  shiftId!: string;
}
