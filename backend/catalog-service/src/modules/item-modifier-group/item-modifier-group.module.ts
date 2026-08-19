import { Module } from '@nestjs/common';
import { ItemModifierGroupService } from './item-modifier-group.service';
import { ItemModifierGroupController } from './item-modifier-group.controller';

@Module({
  controllers: [ItemModifierGroupController],
  providers: [ItemModifierGroupService],
})
export class ItemModifierGroupModule {}
