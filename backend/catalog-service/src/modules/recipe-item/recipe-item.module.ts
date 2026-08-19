import { Module } from '@nestjs/common';
import { RecipeItemService } from './recipe-item.service';
import { RecipeItemController } from './recipe-item.controller';

@Module({
  controllers: [RecipeItemController],
  providers: [RecipeItemService],
})
export class RecipeItemModule {}
