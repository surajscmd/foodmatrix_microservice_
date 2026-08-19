import { PartialType } from '@nestjs/mapped-types';
import { CreateShiftScheduleDto } from './create-shift-schedule.dto.js';

export class UpdateShiftScheduleDto extends PartialType(
  CreateShiftScheduleDto,
) {}
