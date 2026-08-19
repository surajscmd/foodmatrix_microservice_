import { Module } from '@nestjs/common';

import { PayslipController } from './payslip.controller.js';
import { PayslipService } from './payslip.service.js';

import { PrismaModule } from '../../lib/prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],

  controllers: [PayslipController],

  providers: [PayslipService],

  exports: [PayslipService],
})
export class PayslipModule {}
