import {
  Body,
  Controller,
  Get,
  Param,
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

  @Post()
  create(@Body() dto: CreatePayrollRunDto) {
    return this.payrollService.create(dto);
  }

  // ============================================================
  // GET ALL
  // ============================================================

  @Get()
  findAll(@Query('restaurantId') restaurantId?: string) {
    return this.payrollService.findAll(restaurantId);
  }

  // ============================================================
  // GET ONE
  // ============================================================

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.payrollService.findOne(id);
  }
  @Post(':id/process')
  process(@Param('id') id: string) {
    return this.payrollService.process(id);
  }
  @Patch(':id/approve')
  approve(@Param('id') id: string) {
    return this.payrollService.approve(id);
  }

  @Patch(':id/pay')
  pay(@Param('id') id: string) {
    return this.payrollService.pay(id);
  }
}
