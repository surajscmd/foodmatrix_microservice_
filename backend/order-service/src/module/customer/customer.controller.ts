import { OrderAccess } from '../../auth/order-access';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Controller('customers')
@OrderAccess('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  // =========================================================
  // CREATE CUSTOMER
  // POST /customers
  // =========================================================

  @Post()
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customerService.create(createCustomerDto);
  }

  // =========================================================
  // GET ALL CUSTOMERS
  // GET /customers
  // =========================================================

  @Get()
  findAll(@Query('page') page = '1', @Query('limit') limit = '10') {
    return this.customerService.findAll(Number(page), Number(limit));
  }

  // =========================================================
  // GET ALL ORDERS FOR CUSTOMER
  // GET /customers/:id/orders
  // =========================================================

  @Get(':id/orders')
  findOrdersByCustomer(@Param('id') id: string) {
    return this.customerService.findOrdersByCustomer(id);
  }

  // =========================================================
  // GET CUSTOMER
  // GET /customers/:id
  // =========================================================

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customerService.findOne(id);
  }

  // =========================================================
  // UPDATE CUSTOMER
  // PATCH /customers/:id
  // =========================================================

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customerService.update(id, updateCustomerDto);
  }

  // =========================================================
  // DELETE CUSTOMER
  // DELETE /customers/:id
  // =========================================================

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.customerService.remove(id);
  }
}
