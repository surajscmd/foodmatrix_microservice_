import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import * as express from 'express';
import { PayslipService } from './payslip.service.js';

@Controller('payslips')
export class PayslipController {
  constructor(private readonly payslipService: PayslipService) {}

  // ============================================================
  // GET ALL
  // ============================================================

  @Get()
  findAll(
    @Query('restaurantId')
    restaurantId?: string,

    @Query('staffId')
    staffId?: string,

    @Query('payrollRunId')
    payrollRunId?: string,
  ) {
    return this.payslipService.findAll(restaurantId, staffId, payrollRunId);
  }

  // ============================================================
  // GET STAFF PAYSLIPS
  // ============================================================

  @Get('staff/:staffId')
  findByStaff(
    @Param('staffId')
    staffId: string,
  ) {
    return this.payslipService.findByStaff(staffId);
  }

  // ============================================================
  // GET SINGLE
  // ============================================================

  @Get(':id')
  findOne(
    @Param('id')
    id: string,
  ) {
    return this.payslipService.findOne(id);
  }

  @Get(':id/download')
  async download(@Param('id') id: string, @Res() res: express.Response) {
    return this.payslipService.download(id, res);
  }
}
