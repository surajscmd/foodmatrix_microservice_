import { InternalCatalogService } from './internal-catalog.service';
import { PrismaService } from '../../lib/prisma/prisma.service';

describe('InternalCatalogService', () => {
  let service: InternalCatalogService;

  const prismaMock = {
    restaurantMenuItem: {
      findMany: jest.fn(),
    },
    modifier: {
      findMany: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new InternalCatalogService(
      prismaMock as unknown as PrismaService,
    );
  });

  describe('getBulkPricing', () => {
    it('should return menu items and modifiers with correct pricing', async () => {
      const restaurantId = 'restaurant-1';

      const menuItemIds = ['menu-item-1', 'menu-item-2'];

      const modifierIds = ['modifier-1', 'modifier-2'];

      prismaMock.restaurantMenuItem.findMany.mockResolvedValue([
        {
          menuItemId: 'menu-item-1',
          price: 149.5,
          isAvailable: true,
          menuItem: {
            name: 'Masala Dosa',
            sku: 'DOS-MAS-001',
            isAvailable: true,
          },
        },
        {
          menuItemId: 'menu-item-2',
          price: 299,
          isAvailable: false,
          menuItem: {
            name: 'Chicken Biryani',
            sku: 'BIR-CHK-001',
            isAvailable: true,
          },
        },
      ]);

      prismaMock.modifier.findMany.mockResolvedValue([
        {
          id: 'modifier-1',
          name: 'Extra Butter',
          extraPrice: 20.0,
          isActive: true,
        },
        {
          id: 'modifier-2',
          name: 'Extra Cheese',
          extraPrice: 40.0,
          isActive: false,
        },
      ]);

      const result = await service.getBulkPricing(
        restaurantId,
        menuItemIds,
        modifierIds,
      );

      expect(prismaMock.restaurantMenuItem.findMany).toHaveBeenCalledWith({
        where: {
          restaurantId,
          menuItemId: {
            in: menuItemIds,
          },
        },
        include: {
          menuItem: true,
        },
      });

      expect(prismaMock.modifier.findMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: modifierIds,
          },
        },
      });

      expect(result).toEqual({
        menuItems: [
          {
            menuItemId: 'menu-item-1',
            name: 'Masala Dosa',
            sku: 'DOS-MAS-001',
            price: 149.5,
            isAvailable: true,
          },
          {
            menuItemId: 'menu-item-2',
            name: 'Chicken Biryani',
            sku: 'BIR-CHK-001',
            price: 299,
            isAvailable: false,
          },
        ],
        modifiers: [
          {
            id: 'modifier-1',
            name: 'Extra Butter',
            extraPrice: 20,
            isActive: true,
          },
          {
            id: 'modifier-2',
            name: 'Extra Cheese',
            extraPrice: 40,
            isActive: false,
          },
        ],
      });
    });

    it('should return empty arrays when no menu items or modifiers are found', async () => {
      prismaMock.restaurantMenuItem.findMany.mockResolvedValue([]);
      prismaMock.modifier.findMany.mockResolvedValue([]);

      const result = await service.getBulkPricing('restaurant-1', [], []);

      expect(result).toEqual({
        menuItems: [],
        modifiers: [],
      });

      expect(prismaMock.restaurantMenuItem.findMany).toHaveBeenCalledWith({
        where: {
          restaurantId: 'restaurant-1',
          menuItemId: {
            in: [],
          },
        },
        include: {
          menuItem: true,
        },
      });

      expect(prismaMock.modifier.findMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: [],
          },
        },
      });
    });

    it('should set menu item unavailable when restaurant item is unavailable', async () => {
      prismaMock.restaurantMenuItem.findMany.mockResolvedValue([
        {
          menuItemId: 'menu-item-1',
          price: 199,
          isAvailable: false,
          menuItem: {
            name: 'Plain Dosa',
            sku: 'DOS-PLA-001',
            isAvailable: true,
          },
        },
      ]);

      prismaMock.modifier.findMany.mockResolvedValue([]);

      const result = await service.getBulkPricing(
        'restaurant-1',
        ['menu-item-1'],
        [],
      );

      expect(result.menuItems[0]).toEqual({
        menuItemId: 'menu-item-1',
        name: 'Plain Dosa',
        sku: 'DOS-PLA-001',
        price: 199,
        isAvailable: false,
      });
    });

    it('should set menu item unavailable when the menu item itself is unavailable', async () => {
      prismaMock.restaurantMenuItem.findMany.mockResolvedValue([
        {
          menuItemId: 'menu-item-1',
          price: 199,
          isAvailable: true,
          menuItem: {
            name: 'Plain Dosa',
            sku: 'DOS-PLA-001',
            isAvailable: false,
          },
        },
      ]);

      prismaMock.modifier.findMany.mockResolvedValue([]);

      const result = await service.getBulkPricing(
        'restaurant-1',
        ['menu-item-1'],
        [],
      );

      expect(result.menuItems[0]).toEqual({
        menuItemId: 'menu-item-1',
        name: 'Plain Dosa',
        sku: 'DOS-PLA-001',
        price: 199,
        isAvailable: false,
      });
    });

    it('should run both Prisma queries', async () => {
      prismaMock.restaurantMenuItem.findMany.mockResolvedValue([]);
      prismaMock.modifier.findMany.mockResolvedValue([]);

      await service.getBulkPricing(
        'restaurant-1',
        ['menu-item-1'],
        ['modifier-1'],
      );

      expect(prismaMock.restaurantMenuItem.findMany).toHaveBeenCalledTimes(1);

      expect(prismaMock.modifier.findMany).toHaveBeenCalledTimes(1);
    });
  });
});
