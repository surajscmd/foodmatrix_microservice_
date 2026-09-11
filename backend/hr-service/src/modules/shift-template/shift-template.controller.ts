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
} from '@nestjs/common';

import { ShiftTemplateService } from './shift-template.service.js';
import { CreateShiftTemplateDto } from './dto/create-shift-template.dto.js';
import { UpdateShiftTemplateDto } from './dto/update-shift-template.dto.js';

@Controller('shift-templates')
export class ShiftTemplateController {
  constructor(private readonly shiftTemplateService: ShiftTemplateService) {}

  /**
   * Create a new shift template.
   */
  @Post()
  async create(@Body() dto: CreateShiftTemplateDto) {
    return this.shiftTemplateService.create(dto);
  }

  /**
   * Get all shift templates.
   *
   * Optional filters:
   * - restaurantId
   * - status
   */
  @Get()
  async findAll(
    @Query('restaurantId') restaurantId?: string,
    @Query('status') status?: string,
  ) {
    return this.shiftTemplateService.findAll(restaurantId, status);
  }

  /**
   * Get a single shift template by ID.
   */
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.shiftTemplateService.findOne(id);
  }

  /**
   * Update a shift template.
   */
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateShiftTemplateDto,
  ) {
    return this.shiftTemplateService.update(id, dto);
  }

  /**
   * Delete a shift template.
   *
   * Templates that are already used by schedules
   * cannot be deleted.
   */
  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.shiftTemplateService.remove(id);
  }
}

// | Method     | URL                                                          | Purpose                                     | Parameters / Body                                            |
// | ---------- | ------------------------------------------------------------ | ------------------------------------------- | ------------------------------------------------------------ |
// | **POST**   | `/shift-templates`                                           | Create a new shift template                 | Body: `restaurantId`, `name`, `type`, `status`, `segments[]` |
// | **GET**    | `/shift-templates`                                           | Get all shift templates                     | Optional query: `restaurantId`, `status`                     |
// | **GET**    | `/shift-templates?restaurantId={restaurantId}`               | Get templates for one restaurant            | `restaurantId`                                               |
// | **GET**    | `/shift-templates?restaurantId={restaurantId}&status=ACTIVE` | Get active templates for a restaurant       | `restaurantId`, `status`                                     |
// | **GET**    | `/shift-templates/{templateId}`                              | Get one shift template with its segments    | `templateId`                                                 |
// | **PATCH**  | `/shift-templates/{templateId}`                              | Update template details or replace segments | Body: any allowed fields                                     |
// | **DELETE** | `/shift-templates/{templateId}`                              | Delete a template                           | `templateId`                                                 |
