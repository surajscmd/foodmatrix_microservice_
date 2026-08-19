import { IsUUID } from 'class-validator';

export class ClockInDto {
  @IsUUID()
  staffId!: string;

  @IsUUID()
  restaurantId!: string;

  @IsUUID()
  shiftScheduleId!: string;
}
