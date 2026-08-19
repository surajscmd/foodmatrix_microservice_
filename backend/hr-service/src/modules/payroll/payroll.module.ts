import { Module } from '@nestjs/common';

import { PayrollController } from './payroll.controller.js';
import { PayrollService } from './payroll.service.js';
import { PayrollCalculationService } from './payroll-calculation.service.js';

@Module({
  controllers: [PayrollController],
  providers: [PayrollService, PayrollCalculationService],
})
export class PayrollModule {}
