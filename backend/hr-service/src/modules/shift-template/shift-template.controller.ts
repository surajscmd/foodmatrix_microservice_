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

import { ShiftTemplateService } from './shift-template.service.js';
import { CreateShiftTemplateDto } from './dto/create-shift-template.dto.js';
import { UpdateShiftTemplateDto } from './dto/update-shift-template.dto.js';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard.js';
import { HrUser, restaurantScope } from '../../auth/hr-access.js';
import type { AuthenticatedUser } from '../../auth/auth.types.js';

@Controller('shift-templates')
@UseGuards(JwtAuthGuard)
export class ShiftTemplateController {
  constructor(private readonly shiftTemplateService: ShiftTemplateService) {}

  /**
   * Create a new shift template.
   */
  @Post()
  async create(
    @HrUser() user: AuthenticatedUser,
    @Body() dto: CreateShiftTemplateDto,
  ) {
    restaurantScope(user, dto.restaurantId);
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
    @HrUser() user: AuthenticatedUser,
    @Query('restaurantId') restaurantId?: string,
    @Query('status') status?: string,
  ) {
    return this.shiftTemplateService.findAll(
      restaurantScope(user, restaurantId, true),
      status,
    );
  }

  /**
   * Get a single shift template by ID.
   */
  @Get(':id')
  async findOne(
    @HrUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const result = await this.shiftTemplateService.findOne(id);
    restaurantScope(user, result.data.restaurantId, true);
    return result;
  }

  /**
   * Update a shift template.
   */
  @Patch(':id')
  async update(
    @HrUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateShiftTemplateDto,
  ) {
    const { data } = await this.findOne(user, id);
    restaurantScope(user, data.restaurantId);
    if (dto.restaurantId) restaurantScope(user, dto.restaurantId);
    return this.shiftTemplateService.update(id, dto);
  }

  /**
   * Delete a shift template.
   *
   * Templates that are already used by schedules
   * cannot be deleted.
   */
  @Delete(':id')
  async remove(
    @HrUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const { data } = await this.findOne(user, id);
    restaurantScope(user, data.restaurantId);
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
