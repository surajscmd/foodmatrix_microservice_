// src/modules/internal-catalog/internal-catalog.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../lib/prisma/prisma.service';

@Injectable()
export class InternalCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async getBulkPricing(
    restaurantId: string,
    menuItemIds: string[],
    modifierIds: string[],
  ) {
    // 1. Fetch both queries at the same time for speed
    const [restaurantMenuItems, modifiers] = await Promise.all([
      this.prisma.restaurantMenuItem.findMany({
        where: { restaurantId, menuItemId: { in: menuItemIds } },
        include: { menuItem: true },
      }),
      this.prisma.modifier.findMany({
        where: { id: { in: modifierIds } },
      }),
    ]);

    // 2. Format the menu items cleanly
    const mappedMenuItems = restaurantMenuItems.map((rmi) => ({
      menuItemId: rmi.menuItemId,
      name: rmi.menuItem.name,
      sku: rmi.menuItem.sku,
      price: Number(rmi.price), // Convert Decimal to Number for JSON
      isAvailable: rmi.isAvailable && rmi.menuItem.isAvailable,
    }));

    // 3. Format the modifiers cleanly
    const mappedModifiers = modifiers.map((mod) => ({
      id: mod.id,
      name: mod.name,
      extraPrice: Number(mod.extraPrice),
      isActive: mod.isActive,
    }));

    return {
      menuItems: mappedMenuItems,
      modifiers: mappedModifiers,
    };
  }
}
