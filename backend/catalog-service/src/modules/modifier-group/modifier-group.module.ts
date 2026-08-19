import { Module } from '@nestjs/common';
import { ModifierGroupService } from './modifier-group.service';
import { ModifierGroupController } from './modifier-group.controller';

@Module({
  controllers: [ModifierGroupController],
  providers: [ModifierGroupService],
})
export class ModifierGroupModule {}
