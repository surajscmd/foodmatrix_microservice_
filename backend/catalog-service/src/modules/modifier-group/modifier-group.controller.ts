import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ModifierGroupService } from './modifier-group.service';
import { CreateModifierGroupDto } from './dto/create-modifier-group.dto';
import { UpdateModifierGroupDto } from './dto/update-modifier-group.dto';

@Controller('modifier-group')
export class ModifierGroupController {
  constructor(private readonly modifierGroupService: ModifierGroupService) {}

  @Post()
  create(@Body() createModifierGroupDto: CreateModifierGroupDto) {
    return this.modifierGroupService.create(createModifierGroupDto);
  }

  @Get()
  findAll() {
    return this.modifierGroupService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.modifierGroupService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateModifierGroupDto: UpdateModifierGroupDto,
  ) {
    return this.modifierGroupService.update(id, updateModifierGroupDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.modifierGroupService.remove(id);
  }
}
