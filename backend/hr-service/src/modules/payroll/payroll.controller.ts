import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { PayrollService } from './payroll.service.js';

import { CreatePayrollRunDto } from './dto/create-payroll-run.dto.js';

@Controller('payroll-runs')
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
  async create(@Body() dto: CreatePayrollRunDto) {
    return this.payrollService.create(dto);
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
  async findAll(@Query('restaurantId') restaurantId?: string) {
    return this.payrollService.findAll(restaurantId);
  }

  // ============================================================
  // FIND ONE
  // ============================================================

  /**
   * Get a single payroll run by ID.
   */
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.payrollService.findOne(id);
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
  async process(@Param('id', ParseUUIDPipe) id: string) {
    return this.payrollService.process(id);
  }

  // ============================================================
  // APPROVE
  // ============================================================

  /**
   * Approve a processed payroll run.
   */
  @Patch(':id/approve')
  async approve(@Param('id', ParseUUIDPipe) id: string) {
    return this.payrollService.approve(id);
  }

  // ============================================================
  // PAY
  // ============================================================

  /**
   * Mark an approved payroll run as paid.
   */
  @Patch(':id/pay')
  async pay(@Param('id', ParseUUIDPipe) id: string) {
    return this.payrollService.pay(id);
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
