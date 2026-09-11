import { Module } from '@nestjs/common';
import { ShiftScheduleController } from './shift-schedule.controller';
import { ShiftScheduleService } from './shift-schedule.service';

@Module({
  controllers: [ShiftScheduleController],
  providers: [ShiftScheduleService],
})
export class ShiftScheduleModule {}
