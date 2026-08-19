import { IsDateString, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateShiftScheduleDto {
  @IsUUID()
  @IsNotEmpty()
  restaurantId!: string;

  @IsUUID()
  @IsNotEmpty()
  staffId!: string;

  @IsUUID()
  @IsNotEmpty()
  shiftTemplateId!: string;

  @IsDateString()
  scheduledStart!: string;

  @IsDateString()
  scheduledEnd!: string;
}
