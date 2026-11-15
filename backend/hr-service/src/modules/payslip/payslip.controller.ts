import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';

import type { Response } from 'express';

import { PayslipService } from './payslip.service.js';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard.js';
import {
  HrUser,
  restaurantDetails,
  restaurantScope,
} from '../../auth/hr-access.js';
import type { AuthenticatedUser } from '../../auth/auth.types.js';

@Controller('payslips')
@UseGuards(JwtAuthGuard)
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
    @HrUser() user: AuthenticatedUser,
    @Query('restaurantId') restaurantId?: string,
    @Query('staffId') staffId?: string,
    @Query('payrollRunId') payrollRunId?: string,
  ) {
    return this.payslipService.findAll(
      restaurantScope(user, restaurantId),
      staffId,
      payrollRunId,
    );
  }

  // ============================================================
  // FIND STAFF PAYSLIPS
  // ============================================================

  /**
   * Get all payslips belonging to a staff member.
   */
  @Get('staff/:staffId')
  async findByStaff(
    @HrUser() user: AuthenticatedUser,
    @Param('staffId', ParseUUIDPipe) staffId: string,
  ) {
    return this.payslipService.findAll(restaurantScope(user), staffId);
  }

  // ============================================================
  // FIND ONE
  // ============================================================

  /**
   * Get a single payslip by ID.
   */
  @Get(':id')
  async findOne(
    @HrUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const result = await this.payslipService.findOne(id);
    restaurantScope(user, result.data.payrollRun.restaurantId);
    return result;
  }

  // ============================================================
  // DOWNLOAD PDF
  // ============================================================

  /**
   * Generate and download a payslip as a PDF.
   */
  @Get(':id/download')
  async download(
    @HrUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const { data } = await this.findOne(user, id);
    const { restaurantId, restaurantName, currency } = data.payrollRun;
    const restaurant =
      restaurantName && currency
        ? undefined
        : restaurantDetails(user, restaurantId);
    return this.payslipService.download(
      id,
      res,
      restaurantName ?? restaurant?.name,
      currency ?? restaurant?.currency,
    );
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
