import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';

import { ItemModifierGroupService } from './item-modifier-group.service';
import { CreateItemModifierGroupDto } from './dto/create-item-modifier-group.dto';

@Controller('item-modifier-groups')
export class ItemModifierGroupController {
  constructor(
    private readonly itemModifierGroupService: ItemModifierGroupService,
  ) {}

  @Post()
  async create(@Body() createDto: CreateItemModifierGroupDto) {
    const result = await this.itemModifierGroupService.create(createDto);

    return {
      message: 'Modifier group assigned to menu item successfully',
      result,
    };
  }

  @Get()
  async findAll(@Query('menuItemId') menuItemId?: string) {
    const result = await this.itemModifierGroupService.findAll(menuItemId);

    return {
      message: 'Item modifier groups retrieved successfully',
      result,
    };
  }

  @Get(':menuItemId/:groupId')
  async findOne(
    @Param('menuItemId') menuItemId: string,
    @Param('groupId') groupId: string,
  ) {
    const result = await this.itemModifierGroupService.findOne(
      menuItemId,
      groupId,
    );

    return {
      message: 'Item modifier group retrieved successfully',
      result,
    };
  }

  @Delete(':menuItemId/:groupId')
  async remove(
    @Param('menuItemId') menuItemId: string,
    @Param('groupId') groupId: string,
  ) {
    return this.itemModifierGroupService.remove(menuItemId, groupId);
  }
}
