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

import { WageService } from './wage.service.js';

import { CreateWageDto } from './dto/create-wage.dto.js';
import { UpdateWageDto } from './dto/update-wage.dto.js';

@Controller('wages')
export class WageController {
  constructor(private readonly wageService: WageService) {}

  @Post()
  create(
    @Body()
    dto: CreateWageDto,
  ) {
    return this.wageService.create(dto);
  }

  @Get()
  findAll(
    @Query('staffId')
    staffId?: string,
  ) {
    return this.wageService.findAll(staffId);
  }

  @Get('staff/:staffId/current')
  getCurrentWage(
    @Param('staffId')
    staffId: string,
  ) {
    return this.wageService.getCurrentWage(staffId);
  }

  @Get(':id')
  findOne(
    @Param('id')
    id: string,
  ) {
    return this.wageService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id')
    id: string,

    @Body()
    dto: UpdateWageDto,
  ) {
    return this.wageService.update(id, dto);
  }

  @Delete(':id')
  remove(
    @Param('id')
    id: string,
  ) {
    return this.wageService.remove(id);
  }
}
