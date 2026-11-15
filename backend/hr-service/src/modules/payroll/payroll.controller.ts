import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { PayrollService } from './payroll.service.js';

import { CreatePayrollRunDto } from './dto/create-payroll-run.dto.js';
import {
  PayrollDeductionsDto,
  PayrollVersionDto,
  RecordPayrollPaymentDto,
  ReopenPayrollDto,
} from './dto/payroll-actions.dto.js';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard.js';
import {
  HrUser,
  restaurantDetails,
  restaurantScope,
} from '../../auth/hr-access.js';
import type { AuthenticatedUser } from '../../auth/auth.types.js';

@Controller('payroll-runs')
@UseGuards(JwtAuthGuard)
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  // ============================================================
  // CREATE
  // ============================================================

  /**
   * Create a new payroll run for a restaurant.
   *
   * The payroll run starts in DRAFT status.
   */
  @Post()
  async create(
    @HrUser() user: AuthenticatedUser,
    @Body() dto: CreatePayrollRunDto,
  ) {
    restaurantScope(user, dto.restaurantId);
    return this.payrollService.create(
      { ...dto, processedById: user.systemUserId ?? user.id },
      restaurantDetails(user, dto.restaurantId),
    );
  }

  // ============================================================
  // FIND ALL
  // ============================================================

  /**
   * Get payroll runs.
   *
   * Optional filter:
   * - restaurantId
   */
  @Get()
  async findAll(
    @HrUser() user: AuthenticatedUser,
    @Query('restaurantId') restaurantId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.payrollService.findAll(
      restaurantScope(user, restaurantId),
      startDate,
      endDate,
    );
  }

  // ============================================================
  // FIND ONE
  // ============================================================

  /**
   * Get a single payroll run by ID.
   */
  @Get(':id')
  async findOne(
    @HrUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const run = await this.payrollService.findOne(id);
    restaurantScope(user, run.data.restaurantId);
    return run;
  }

  // ============================================================
  // PROCESS
  // ============================================================

  /**
   * Process a payroll run.
   *
   * Calculates employee payroll based on:
   * - Worked hours
   * - Overtime
   * - Approved paid leave
   * - Applicable wage history
   */
  @Post(':id/process')
  async process(
    @HrUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const { data } = await this.findOne(user, id);
    return this.payrollService.process(
      id,
      restaurantDetails(user, data.restaurantId),
    );
  }

  // ============================================================
  // APPROVE
  // ============================================================

  /**
   * Approve a processed payroll run.
   */
  @Patch(':id/approve')
  async approve(
    @HrUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PayrollVersionDto,
  ) {
    await this.findOne(user, id);
    return this.payrollService.approve(id, dto);
  }

  // ============================================================
  // PAY
  // ============================================================

  /**
   * Mark an approved payroll run as paid.
   */
  @Patch(':id/pay')
  async pay(
    @HrUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordPayrollPaymentDto,
  ) {
    await this.findOne(user, id);
    return this.payrollService.pay(id, dto, user.systemUserId ?? user.id);
  }

  @Patch(':id/reopen')
  async reopen(
    @HrUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReopenPayrollDto,
  ) {
    await this.findOne(user, id);
    return this.payrollService.reopen(id, dto, user.systemUserId ?? user.id);
  }

  @Patch(':id/payslips/:payslipId/deductions')
  async saveDeductions(
    @HrUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('payslipId', ParseUUIDPipe) payslipId: string,
    @Body() dto: PayrollDeductionsDto,
  ) {
    await this.findOne(user, id);
    return this.payrollService.saveDeductions(id, payslipId, dto);
  }

  @Delete(':id')
  async removeDraft(
    @HrUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.findOne(user, id);
    return this.payrollService.removeDraft(id);
  }
}

// | Method    | URL                                         | Purpose                               | Body / Query                                                        |
// | --------- | ------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------- |
// | **POST**  | `/payroll-runs`                             | Create a new payroll run              | `restaurantId`, `periodStartDate`, `periodEndDate`, `processedById` |
// | **GET**   | `/payroll-runs`                             | Get all payroll runs                  | Optional: `restaurantId`                                            |
// | **GET**   | `/payroll-runs?restaurantId={restaurantId}` | Get payroll runs for one restaurant   | `restaurantId`                                                      |
// | **GET**   | `/payroll-runs/{payrollRunId}`              | Get one payroll run with payslips     | `payrollRunId`                                                      |
// | **POST**  | `/payroll-runs/{payrollRunId}/process`      | Calculate payroll and create payslips | No body                                                             |
// | **PATCH** | `/payroll-runs/{payrollRunId}/approve`      | Approve processed payroll             | No body                                                             |
// | **PATCH** | `/payroll-runs/{payrollRunId}/pay`          | Mark approved payroll as paid         | No body                                                             |

// Complete Payroll Flow
// | Step | API                               | Result                      |
// | ---- | --------------------------------- | --------------------------- |
// | 1    | `POST /payroll-runs`              | Create payroll              |
// | 2    | `POST /payroll-runs/:id/process`  | Calculate + create payslips |
// | 3    | `PATCH /payroll-runs/:id/approve` | Approve payroll             |
// | 4    | `PATCH /payroll-runs/:id/pay`     | Mark as paid                |
