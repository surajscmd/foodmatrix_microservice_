import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { WasteLogService } from './waste-log.service.js';

import { CreateWasteLogDto } from './dto/create-waste-log.dto.js';

@Controller('waste-logs')
export class WasteLogController {
  constructor(private readonly wasteLogService: WasteLogService) {}

  // ======================================================
  // CREATE WASTE
  //
  // POST /waste-logs
  // ======================================================

  @Post()
  async create(@Body() dto: CreateWasteLogDto) {
    const data = await this.wasteLogService.create(dto);

    return {
      message: 'Waste logged successfully',
      data,
    };
  }

  // ======================================================
  // GET RESTAURANT WASTE LOGS
  //
  // GET /waste-logs/restaurant/:restaurantId
  // ======================================================

  @Get('restaurant/:restaurantId')
  async findByRestaurant(@Param('restaurantId') restaurantId: string) {
    const data = await this.wasteLogService.findByRestaurant(restaurantId);

    return {
      message: 'Restaurant waste logs fetched successfully',
      data,
    };
  }

  // ======================================================
  // GET SINGLE WASTE LOG
  //
  // GET /waste-logs/:id
  // ======================================================

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.wasteLogService.findOne(id);

    return {
      message: 'Waste log fetched successfully',
      data,
    };
  }
}
