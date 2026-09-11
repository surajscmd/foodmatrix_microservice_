import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  Res,
} from '@nestjs/common';

import type { Response } from 'express';

import { PayslipService } from './payslip.service.js';

@Controller('payslips')
export class PayslipController {
  constructor(private readonly payslipService: PayslipService) {}

  // ============================================================
  // FIND ALL
  // ============================================================

  /**
   * Get payslips.
   *
   * Optional filters:
   * - restaurantId
   * - staffId
   * - payrollRunId
   */
  @Get()
  async findAll(
    @Query('restaurantId') restaurantId?: string,
    @Query('staffId') staffId?: string,
    @Query('payrollRunId') payrollRunId?: string,
  ) {
    return this.payslipService.findAll(restaurantId, staffId, payrollRunId);
  }

  // ============================================================
  // FIND STAFF PAYSLIPS
  // ============================================================

  /**
   * Get all payslips belonging to a staff member.
   */
  @Get('staff/:staffId')
  async findByStaff(@Param('staffId', ParseUUIDPipe) staffId: string) {
    return this.payslipService.findByStaff(staffId);
  }

  // ============================================================
  // FIND ONE
  // ============================================================

  /**
   * Get a single payslip by ID.
   */
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.payslipService.findOne(id);
  }

  // ============================================================
  // DOWNLOAD PDF
  // ============================================================

  /**
   * Generate and download a payslip as a PDF.
   */
  @Get(':id/download')
  async download(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    return this.payslipService.download(id, res);
  }
}
// Your Payslip flow is now
// | Step | API                              | Purpose                  |
// | ---- | -------------------------------- | ------------------------ |
// | 1    | `GET /payslips`                  | All payslips             |
// | 2    | `GET /payslips?restaurantId=...` | Restaurant payslips      |
// | 3    | `GET /payslips?staffId=...`      | Employee payslips        |
// | 4    | `GET /payslips?payrollRunId=...` | Payslips for payroll run |
// | 5    | `GET /payslips/staff/:staffId`   | Employee payslip history |
// | 6    | `GET /payslips/:id`              | Single payslip           |
// | 7    | `GET /payslips/:id/download`     | Generate/download PDF    |
