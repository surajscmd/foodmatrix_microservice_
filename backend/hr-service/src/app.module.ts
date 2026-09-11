import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './lib/prisma/prisma.module';
import { StaffModule } from './modules/staff/staff.module';
import { ShiftTemplateModule } from './modules/shift-template/shift-template.module';
import { ShiftScheduleModule } from './modules/shift-schedule/shift-schedule.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { LeaveModule } from './modules/leave/leave.module';
import { WageModule } from './modules/wage/wage.module';
import { PayrollModule } from './modules/payroll/payroll.module';
import { PayslipModule } from './modules/payslip/payslip.module';
import { KafkaModule } from './modules/kafka/kafka.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    StaffModule,
    ShiftTemplateModule,
    ShiftScheduleModule,
    AttendanceModule,
    LeaveModule,
    WageModule,
    PayrollModule,
    PayslipModule,
    KafkaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
