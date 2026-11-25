import { HealthController } from './health.controller';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './lib/prisma/prisma.module';
import { MenuCategoryModule } from './modules/menu-category/menu-category.module';
import { MenuItemModule } from './modules/menu-item/menu-item.module';
import { IngredientModule } from './modules/ingredient/ingredient.module';
import { RestaurantMenuItemModule } from './modules/restaurant-menu-item/restaurant-menu-item.module';
import { ModifierGroupModule } from './modules/modifier-group/modifier-group.module';
import { ModifierModule } from './modules/modifier/modifier.module';
import { ItemModifierGroupModule } from './modules/item-modifier-group/item-modifier-group.module';
import { RecipeItemModule } from './modules/recipe-item/recipe-item.module';
import { InternalCatalogModule } from './modules/internal-catalog/internal-catalog.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    MenuCategoryModule,
    MenuItemModule,
    IngredientModule,
    RestaurantMenuItemModule,
    ModifierGroupModule,
    ModifierModule,
    ItemModifierGroupModule,
    RecipeItemModule,
    InternalCatalogModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
