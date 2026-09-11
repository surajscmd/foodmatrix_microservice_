import { IsDateString, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateShiftScheduleDto {
  // Restaurant to which the schedule belongs.
  @IsUUID()
  @IsNotEmpty()
  restaurantId!: string;

  // Staff member who is assigned to the shift.
  @IsUUID()
  @IsNotEmpty()
  staffId!: string;

  // Active shift template used for this schedule.
  @IsUUID()
  @IsNotEmpty()
  shiftTemplateId!: string;

  // Planned shift start date and time.
  @IsDateString()
  @IsNotEmpty()
  scheduledStart!: string;

  // Planned shift end date and time.
  @IsDateString()
  @IsNotEmpty()
  scheduledEnd!: string;
}
