/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
import { ModifierService } from './modifier.service';
import { CreateModifierDto } from './dto/create-modifier.dto';
import { UpdateModifierDto } from './dto/update-modifier.dto';

@Controller('modifiers')
export class ModifierController {
  constructor(private readonly modifierService: ModifierService) {}

  @Post()
  async create(@Body() createDto: CreateModifierDto) {
    const result = await this.modifierService.create(createDto);

    return {
      message: 'Modifier created successfully',
      result,
    };
  }

  @Get()
  async findAll(@Query('groupId') groupId?: string) {
    const result = await this.modifierService.findAll(groupId);

    return {
      message: 'Modifiers retrieved successfully',
      result,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.modifierService.findOne(id);

    return {
      message: 'Modifier retrieved successfully',
      result,
    };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateModifierDto) {
    const result = await this.modifierService.update(id, updateDto);

    return {
      message: 'Modifier updated successfully',
      result,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.modifierService.remove(id);

    return {
      message: result.message,
    };
  }
}
