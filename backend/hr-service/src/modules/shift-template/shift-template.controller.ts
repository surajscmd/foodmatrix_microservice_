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

import { ShiftTemplateService } from './shift-template.service.js';

import { CreateShiftTemplateDto } from './dto/create-shift-template.dto.js';
import { UpdateShiftTemplateDto } from './dto/update-shift-template.dto.js';

@Controller('shift-templates')
export class ShiftTemplateController {
  constructor(private readonly shiftTemplateService: ShiftTemplateService) {}

  @Post()
  create(
    @Body()
    dto: CreateShiftTemplateDto,
  ) {
    return this.shiftTemplateService.create(dto);
  }

  @Get()
  findAll(
    @Query('restaurantId')
    restaurantId?: string,
  ) {
    return this.shiftTemplateService.findAll(restaurantId);
  }

  @Get(':id')
  findOne(
    @Param('id')
    id: string,
  ) {
    return this.shiftTemplateService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id')
    id: string,

    @Body()
    dto: UpdateShiftTemplateDto,
  ) {
    return this.shiftTemplateService.update(id, dto);
  }

  @Delete(':id')
  remove(
    @Param('id')
    id: string,
  ) {
    return this.shiftTemplateService.remove(id);
  }
}
