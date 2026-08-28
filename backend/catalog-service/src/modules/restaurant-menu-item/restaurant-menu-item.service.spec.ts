import { ConflictException, NotFoundException } from '@nestjs/common';

import {
  Prisma,
  type MenuCategory,
  type MenuItem,
  type RestaurantMenuItem,
} from '@prisma/client';

import { PrismaService } from '../../lib/prisma/prisma.service';
import { RestaurantMenuItemService } from './restaurant-menu-item.service';

import { CreateRestaurantMenuItemDto } from './dto/create-restaurant-menu-item.dto';
import { UpdateRestaurantMenuItemDto } from './dto/update-restaurant-menu-item.dto';

// ============================================================
// TEST TYPES
// ============================================================

type MenuItemWithCategoryAndRestaurantMenu = MenuItem & {
  category: MenuCategory;
  restaurantMenus: RestaurantMenuItem[];
};

type RestaurantMenuItemWithMenuItem = RestaurantMenuItem & {
  menuItem: MenuItem & {
    category: MenuCategory;
  };
};

type RestaurantMenuItemFindUniqueResult =
  RestaurantMenuItem | RestaurantMenuItemWithMenuItem | null;

// ============================================================
// TEST SUITE
// ============================================================

describe('RestaurantMenuItemService', () => {
  let service: RestaurantMenuItemService;

  // ============================================================
  // PRISMA MOCKS
  // ============================================================

  const menuItemFindUnique = jest.fn<Promise<MenuItem | null>, [unknown]>();

  const menuItemFindMany = jest.fn<
    Promise<MenuItemWithCategoryAndRestaurantMenu[]>,
    [unknown]
  >();

  const menuItemCount = jest.fn<Promise<number>, [unknown]>();

  const restaurantMenuItemFindUnique = jest.fn<
    Promise<RestaurantMenuItemFindUniqueResult>,
    [unknown]
  >();

  const restaurantMenuItemFindMany = jest.fn<
    Promise<RestaurantMenuItemWithMenuItem[]>,
    [unknown]
  >();

  const restaurantMenuItemCreate = jest.fn<
    Promise<RestaurantMenuItemWithMenuItem>,
    [unknown]
  >();

  const restaurantMenuItemUpdate = jest.fn<
    Promise<RestaurantMenuItemWithMenuItem>,
    [unknown]
  >();

  const restaurantMenuItemDelete = jest.fn<
    Promise<RestaurantMenuItem>,
    [unknown]
  >();

  const prismaMock = {
    menuItem: {
      findUnique: menuItemFindUnique,
      findMany: menuItemFindMany,
      count: menuItemCount,
    },

    restaurantMenuItem: {
      findUnique: restaurantMenuItemFindUnique,
      findMany: restaurantMenuItemFindMany,
      create: restaurantMenuItemCreate,
      update: restaurantMenuItemUpdate,
      delete: restaurantMenuItemDelete,
    },
  };

  // ============================================================
  // SETUP
  // ============================================================

  beforeEach(() => {
    jest.clearAllMocks();

    service = new RestaurantMenuItemService(
      prismaMock as unknown as PrismaService,
    );
  });

  // ============================================================
  // TEST DATA
  // ============================================================

  const category: MenuCategory = {
    id: 'category-1',
    name: 'South Indian Breakfast',
    sortOrder: 1,
    isActive: true,
    createdAt: new Date('2026-08-27T11:16:03.561Z'),
    updatedAt: new Date('2026-08-27T11:48:37.073Z'),
  };

  const menuItem: MenuItem = {
    id: 'menu-item-1',
    categoryId: 'category-1',
    name: 'Idli',
    sku: 'SID-IDL-001',
    description: 'Soft steamed rice cakes',
    basePrice: new Prisma.Decimal('79.00'),
    isAvailable: true,
    createdAt: new Date('2026-08-27T11:16:04.096Z'),
    updatedAt: new Date('2026-08-27T11:48:37.635Z'),
  };

  const secondMenuItem: MenuItem = {
    ...menuItem,
    id: 'menu-item-2',
    name: 'Masala Dosa',
    sku: 'DOS-MAS-001',
    basePrice: new Prisma.Decimal('139.00'),
  };

  const restaurantMenuItem: RestaurantMenuItem = {
    id: 'restaurant-menu-item-1',
    restaurantId: 'restaurant-1',
    menuItemId: 'menu-item-1',
    price: new Prisma.Decimal('90.00'),
    isAvailable: true,
    createdAt: new Date('2026-08-28T10:00:00.000Z'),
    updatedAt: new Date('2026-08-28T10:00:00.000Z'),
  };

  const restaurantMenuItemWithMenuItem: RestaurantMenuItemWithMenuItem = {
    ...restaurantMenuItem,
    menuItem: {
      ...menuItem,
      category,
    },
  };

  const secondRestaurantMenuItem: RestaurantMenuItemWithMenuItem = {
    id: 'restaurant-menu-item-2',
    restaurantId: 'restaurant-1',
    menuItemId: 'menu-item-2',
    price: new Prisma.Decimal('159.00'),
    isAvailable: true,
    createdAt: new Date('2026-08-28T11:00:00.000Z'),
    updatedAt: new Date('2026-08-28T11:00:00.000Z'),
    menuItem: {
      ...secondMenuItem,
      category,
    },
  };

  // ============================================================
  // CREATE
  // ============================================================

  describe('create', () => {
    it('should create restaurant menu item successfully', async () => {
      const dto: CreateRestaurantMenuItemDto = {
        restaurantId: 'restaurant-1',
        menuItemId: 'menu-item-1',
        price: 90,
        isAvailable: true,
      };

      menuItemFindUnique.mockResolvedValue(menuItem);

      restaurantMenuItemFindUnique.mockResolvedValue(null);

      restaurantMenuItemCreate.mockResolvedValue(
        restaurantMenuItemWithMenuItem,
      );

      const result = await service.create(dto);

      expect(menuItemFindUnique).toHaveBeenCalledWith({
        where: {
          id: 'menu-item-1',
        },
      });

      expect(restaurantMenuItemFindUnique).toHaveBeenCalledWith({
        where: {
          restaurantId_menuItemId: {
            restaurantId: 'restaurant-1',
            menuItemId: 'menu-item-1',
          },
        },
      });

      expect(restaurantMenuItemCreate).toHaveBeenCalledWith({
        data: {
          restaurantId: 'restaurant-1',
          menuItemId: 'menu-item-1',
          price: 90,
          isAvailable: true,
        },
        include: {
          menuItem: {
            include: {
              category: true,
            },
          },
        },
      });

      expect(result).toEqual(restaurantMenuItemWithMenuItem);
    });

    it('should throw NotFoundException when menu item does not exist', async () => {
      const dto: CreateRestaurantMenuItemDto = {
        restaurantId: 'restaurant-1',
        menuItemId: 'missing-menu-item',
        price: 90,
        isAvailable: true,
      };

      menuItemFindUnique.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(
        new NotFoundException('Menu item not found'),
      );

      expect(restaurantMenuItemCreate).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when menu item is already configured', async () => {
      const dto: CreateRestaurantMenuItemDto = {
        restaurantId: 'restaurant-1',
        menuItemId: 'menu-item-1',
        price: 90,
        isAvailable: true,
      };

      menuItemFindUnique.mockResolvedValue(menuItem);

      restaurantMenuItemFindUnique.mockResolvedValue(restaurantMenuItem);

      await expect(service.create(dto)).rejects.toThrow(
        new ConflictException(
          'Menu item is already configured for this restaurant',
        ),
      );

      expect(restaurantMenuItemCreate).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when price is same as base price', async () => {
      const dto: CreateRestaurantMenuItemDto = {
        restaurantId: 'restaurant-2',
        menuItemId: 'menu-item-1',
        price: 79,
        isAvailable: true,
      };

      menuItemFindUnique.mockResolvedValue(menuItem);

      await expect(service.create(dto)).rejects.toThrow(
        new ConflictException(
          'Restaurant price is the same as the default price. No override is required.',
        ),
      );

      expect(restaurantMenuItemFindUnique).not.toHaveBeenCalled();

      expect(restaurantMenuItemCreate).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // FIND ALL
  // ============================================================

  describe('findAll', () => {
    const restaurantConfiguration: RestaurantMenuItemWithMenuItem = {
      ...restaurantMenuItemWithMenuItem,
    };

    const menuItems: MenuItemWithCategoryAndRestaurantMenu[] = [
      {
        ...menuItem,
        category,
        restaurantMenus: [restaurantConfiguration],
      },
      {
        ...secondMenuItem,
        category,
        restaurantMenus: [],
      },
    ];

    it('should return all menu items with restaurant price override', async () => {
      menuItemFindMany.mockResolvedValue(menuItems);

      menuItemCount.mockResolvedValue(2);

      const result = await service.findAll('restaurant-1', 1, 10);

      expect(menuItemFindMany).toHaveBeenCalledWith({
        where: {
          isAvailable: true,
        },
        skip: 0,
        take: 10,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          category: true,
          restaurantMenus: {
            where: {
              restaurantId: 'restaurant-1',
            },
          },
        },
      });

      expect(menuItemCount).toHaveBeenCalledWith({
        where: {
          isAvailable: true,
        },
      });

      expect(result).toEqual({
        data: [
          {
            id: 'menu-item-1',
            name: 'Idli',
            sku: 'SID-IDL-001',
            description: 'Soft steamed rice cakes',
            price: 90,
            isAvailable: true,
            restaurantConfigured: true,
            restaurantMenuItemId: 'restaurant-menu-item-1',
            category: {
              id: 'category-1',
              name: 'South Indian Breakfast',
              sortOrder: 1,
            },
          },
          {
            id: 'menu-item-2',
            name: 'Masala Dosa',
            sku: 'DOS-MAS-001',
            description: 'Soft steamed rice cakes',
            price: 139,
            isAvailable: true,
            restaurantConfigured: false,
            restaurantMenuItemId: null,
            category: {
              id: 'category-1',
              name: 'South Indian Breakfast',
              sortOrder: 1,
            },
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        },
      });
    });

    it('should use base price when restaurant has no configuration', async () => {
      const itemWithoutOverride: MenuItemWithCategoryAndRestaurantMenu = {
        ...menuItem,
        category,
        restaurantMenus: [],
      };

      menuItemFindMany.mockResolvedValue([itemWithoutOverride]);

      menuItemCount.mockResolvedValue(1);

      const result = await service.findAll('restaurant-1');

      expect(result.data[0]).toEqual({
        id: 'menu-item-1',
        name: 'Idli',
        sku: 'SID-IDL-001',
        description: 'Soft steamed rice cakes',
        price: 79,
        isAvailable: true,
        restaurantConfigured: false,
        restaurantMenuItemId: null,
        category: {
          id: 'category-1',
          name: 'South Indian Breakfast',
          sortOrder: 1,
        },
      });
    });

    it('should paginate menu items', async () => {
      menuItemFindMany.mockResolvedValue([
        {
          ...menuItem,
          category,
          restaurantMenus: [],
        },
      ]);

      menuItemCount.mockResolvedValue(25);

      const result = await service.findAll('restaurant-1', 2, 10);

      expect(menuItemFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );

      expect(result.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
      });
    });
  });

  // ============================================================
  // FIND CHANGED ITEMS
  // ============================================================

  describe('findChangedItems', () => {
    it('should return only changed prices for one restaurant', async () => {
      const samePriceItem: RestaurantMenuItemWithMenuItem = {
        ...restaurantMenuItemWithMenuItem,
        id: 'same-price',
        price: new Prisma.Decimal('79.00'),
      };

      restaurantMenuItemFindMany.mockResolvedValue([
        restaurantMenuItemWithMenuItem,
        samePriceItem,
      ]);

      const result = await service.findChangedItems('restaurant-1', 1, 10);

      expect(restaurantMenuItemFindMany).toHaveBeenCalledWith({
        where: {
          restaurantId: 'restaurant-1',
        },
        include: {
          menuItem: {
            include: {
              category: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      expect(result.data).toEqual([
        {
          id: 'restaurant-menu-item-1',
          restaurantId: 'restaurant-1',
          menuItem: {
            id: 'menu-item-1',
            name: 'Idli',
            sku: 'SID-IDL-001',
          },
          defaultPrice: 79,
          restaurantPrice: 90,
          priceDifference: 11,
          isAvailable: true,
        },
      ]);

      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
    });

    it('should paginate changed items', async () => {
      const items = Array.from({ length: 15 }, (_, index) => ({
        ...restaurantMenuItemWithMenuItem,
        id: `restaurant-menu-item-${index + 1}`,
        price: new Prisma.Decimal(`${90 + index}`),
      }));

      restaurantMenuItemFindMany.mockResolvedValue(items);

      const result = await service.findChangedItems('restaurant-1', 2, 10);

      expect(result.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 15,
        totalPages: 2,
      });

      expect(result.data).toHaveLength(5);
    });

    it('should return empty data when there are no changed items', async () => {
      const samePriceItem: RestaurantMenuItemWithMenuItem = {
        ...restaurantMenuItemWithMenuItem,
        price: menuItem.basePrice,
      };

      restaurantMenuItemFindMany.mockResolvedValue([samePriceItem]);

      const result = await service.findChangedItems('restaurant-1');

      expect(result).toEqual({
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      });
    });
  });

  // ============================================================
  // FIND ALL CHANGED ITEMS
  // ============================================================

  describe('findAllChangedItems', () => {
    it('should return changed items grouped by restaurant', async () => {
      const restaurantTwoItem: RestaurantMenuItemWithMenuItem = {
        ...secondRestaurantMenuItem,
        restaurantId: 'restaurant-2',
      };

      restaurantMenuItemFindMany.mockResolvedValue([
        restaurantMenuItemWithMenuItem,
        restaurantTwoItem,
      ]);

      const result = await service.findAllChangedItems(1, 10);

      expect(restaurantMenuItemFindMany).toHaveBeenCalledWith({
        include: {
          menuItem: {
            include: {
              category: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      expect(result.data).toEqual([
        {
          restaurantId: 'restaurant-1',
          menuItems: [
            {
              id: 'restaurant-menu-item-1',
              menuItem: {
                id: 'menu-item-1',
                name: 'Idli',
                sku: 'SID-IDL-001',
              },
              category: {
                id: 'category-1',
                name: 'South Indian Breakfast',
              },
              defaultPrice: 79,
              restaurantPrice: 90,
              priceDifference: 11,
              isAvailable: true,
            },
          ],
        },
        {
          restaurantId: 'restaurant-2',
          menuItems: [
            {
              id: 'restaurant-menu-item-2',
              menuItem: {
                id: 'menu-item-2',
                name: 'Masala Dosa',
                sku: 'DOS-MAS-001',
              },
              category: {
                id: 'category-1',
                name: 'South Indian Breakfast',
              },
              defaultPrice: 139,
              restaurantPrice: 159,
              priceDifference: 20,
              isAvailable: true,
            },
          ],
        },
      ]);

      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        totalRestaurants: 2,
        totalChangedItems: 2,
        totalPages: 1,
      });
    });

    it('should ignore items with the same price as base price', async () => {
      const samePriceItem: RestaurantMenuItemWithMenuItem = {
        ...restaurantMenuItemWithMenuItem,
        price: menuItem.basePrice,
      };

      restaurantMenuItemFindMany.mockResolvedValue([samePriceItem]);

      const result = await service.findAllChangedItems();

      expect(result).toEqual({
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          totalRestaurants: 0,
          totalChangedItems: 0,
          totalPages: 0,
        },
      });
    });
  });

  // ============================================================
  // FIND ONE
  // ============================================================

  describe('findOne', () => {
    it('should return one restaurant menu item', async () => {
      restaurantMenuItemFindUnique.mockResolvedValue(
        restaurantMenuItemWithMenuItem,
      );

      const result = await service.findOne('restaurant-menu-item-1');

      expect(restaurantMenuItemFindUnique).toHaveBeenCalledWith({
        where: {
          id: 'restaurant-menu-item-1',
        },
        include: {
          menuItem: {
            include: {
              category: true,
            },
          },
        },
      });

      expect(result).toEqual({
        id: 'restaurant-menu-item-1',
        restaurantId: 'restaurant-1',
        menuItem: {
          id: 'menu-item-1',
          name: 'Idli',
          sku: 'SID-IDL-001',
          description: 'Soft steamed rice cakes',
        },
        defaultPrice: 79,
        restaurantPrice: 90,
        priceDifference: 11,
        isAvailable: true,
        category: {
          id: 'category-1',
          name: 'South Indian Breakfast',
          sortOrder: 1,
        },
      });
    });

    it('should throw NotFoundException when item does not exist', async () => {
      restaurantMenuItemFindUnique.mockResolvedValue(null);

      await expect(service.findOne('missing-id')).rejects.toThrow(
        new NotFoundException('Restaurant menu item not found'),
      );
    });
  });

  // ============================================================
  // UPDATE
  // ============================================================

  describe('update', () => {
    it('should update price successfully', async () => {
      const updatedItem: RestaurantMenuItemWithMenuItem = {
        ...restaurantMenuItemWithMenuItem,
        price: new Prisma.Decimal('100.00'),
      };

      restaurantMenuItemFindUnique.mockResolvedValue(restaurantMenuItem);

      restaurantMenuItemUpdate.mockResolvedValue(updatedItem);

      const dto: UpdateRestaurantMenuItemDto = {
        price: 100,
      };

      const result = await service.update('restaurant-menu-item-1', dto);

      expect(restaurantMenuItemFindUnique).toHaveBeenCalledWith({
        where: {
          id: 'restaurant-menu-item-1',
        },
      });

      expect(restaurantMenuItemUpdate).toHaveBeenCalledWith({
        where: {
          id: 'restaurant-menu-item-1',
        },
        data: {
          price: 100,
        },
        include: {
          menuItem: {
            include: {
              category: true,
            },
          },
        },
      });

      expect(result).toEqual(updatedItem);
    });

    it('should update only isAvailable', async () => {
      const updatedItem: RestaurantMenuItemWithMenuItem = {
        ...restaurantMenuItemWithMenuItem,
        isAvailable: false,
      };

      restaurantMenuItemFindUnique.mockResolvedValue(restaurantMenuItem);

      restaurantMenuItemUpdate.mockResolvedValue(updatedItem);

      const dto: UpdateRestaurantMenuItemDto = {
        isAvailable: false,
      };

      const result = await service.update('restaurant-menu-item-1', dto);

      expect(restaurantMenuItemUpdate).toHaveBeenCalledWith({
        where: {
          id: 'restaurant-menu-item-1',
        },
        data: {
          isAvailable: false,
        },
        include: {
          menuItem: {
            include: {
              category: true,
            },
          },
        },
      });

      expect(result).toEqual(updatedItem);
    });

    it('should update restaurantId and menuItemId', async () => {
      const updatedItem: RestaurantMenuItemWithMenuItem = {
        ...restaurantMenuItemWithMenuItem,
        restaurantId: 'restaurant-2',
        menuItemId: 'menu-item-2',
        menuItem: {
          ...secondMenuItem,
          category,
        },
      };

      restaurantMenuItemFindUnique
        .mockResolvedValueOnce(restaurantMenuItem)
        .mockResolvedValueOnce(null);

      menuItemFindUnique.mockResolvedValue(secondMenuItem);

      restaurantMenuItemUpdate.mockResolvedValue(updatedItem);

      const dto: UpdateRestaurantMenuItemDto = {
        restaurantId: 'restaurant-2',
        menuItemId: 'menu-item-2',
      };

      const result = await service.update('restaurant-menu-item-1', dto);

      expect(restaurantMenuItemFindUnique).toHaveBeenNthCalledWith(1, {
        where: {
          id: 'restaurant-menu-item-1',
        },
      });

      expect(restaurantMenuItemFindUnique).toHaveBeenNthCalledWith(2, {
        where: {
          restaurantId_menuItemId: {
            restaurantId: 'restaurant-2',
            menuItemId: 'menu-item-2',
          },
        },
      });

      expect(menuItemFindUnique).toHaveBeenCalledWith({
        where: {
          id: 'menu-item-2',
        },
      });

      expect(restaurantMenuItemUpdate).toHaveBeenCalledWith({
        where: {
          id: 'restaurant-menu-item-1',
        },
        data: {
          restaurantId: 'restaurant-2',
          menuItemId: 'menu-item-2',
        },
        include: {
          menuItem: {
            include: {
              category: true,
            },
          },
        },
      });

      expect(result).toEqual(updatedItem);
    });

    it('should throw NotFoundException when item does not exist', async () => {
      restaurantMenuItemFindUnique.mockResolvedValue(null);

      const dto: UpdateRestaurantMenuItemDto = {
        price: 100,
      };

      await expect(service.update('missing-id', dto)).rejects.toThrow(
        new NotFoundException('Restaurant menu item not found'),
      );

      expect(restaurantMenuItemUpdate).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when new combination already exists', async () => {
      const duplicate: RestaurantMenuItem = {
        ...restaurantMenuItem,
        id: 'duplicate-id',
        restaurantId: 'restaurant-2',
        menuItemId: 'menu-item-2',
      };

      restaurantMenuItemFindUnique
        .mockResolvedValueOnce(restaurantMenuItem)
        .mockResolvedValueOnce(duplicate);

      const dto: UpdateRestaurantMenuItemDto = {
        restaurantId: 'restaurant-2',
        menuItemId: 'menu-item-2',
      };

      await expect(
        service.update('restaurant-menu-item-1', dto),
      ).rejects.toThrow(
        new ConflictException(
          'This menu item is already configured for this restaurant',
        ),
      );

      expect(restaurantMenuItemUpdate).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when new menu item does not exist', async () => {
      restaurantMenuItemFindUnique
        .mockResolvedValueOnce(restaurantMenuItem)
        .mockResolvedValueOnce(null);

      menuItemFindUnique.mockResolvedValue(null);

      const dto: UpdateRestaurantMenuItemDto = {
        menuItemId: 'missing-menu-item',
      };

      await expect(
        service.update('restaurant-menu-item-1', dto),
      ).rejects.toThrow(new NotFoundException('Menu item not found'));

      expect(restaurantMenuItemUpdate).not.toHaveBeenCalled();
    });

    it('should update price and availability together', async () => {
      const updatedItem: RestaurantMenuItemWithMenuItem = {
        ...restaurantMenuItemWithMenuItem,
        price: new Prisma.Decimal('110.00'),
        isAvailable: false,
      };

      restaurantMenuItemFindUnique.mockResolvedValue(restaurantMenuItem);

      restaurantMenuItemUpdate.mockResolvedValue(updatedItem);

      const dto: UpdateRestaurantMenuItemDto = {
        price: 110,
        isAvailable: false,
      };

      const result = await service.update('restaurant-menu-item-1', dto);

      expect(restaurantMenuItemUpdate).toHaveBeenCalledWith({
        where: {
          id: 'restaurant-menu-item-1',
        },
        data: {
          price: 110,
          isAvailable: false,
        },
        include: {
          menuItem: {
            include: {
              category: true,
            },
          },
        },
      });

      expect(result).toEqual(updatedItem);
    });
  });

  // ============================================================
  // REMOVE
  // ============================================================

  describe('remove', () => {
    it('should delete restaurant menu item successfully', async () => {
      restaurantMenuItemFindUnique.mockResolvedValue(restaurantMenuItem);

      restaurantMenuItemDelete.mockResolvedValue(restaurantMenuItem);

      const result = await service.remove('restaurant-menu-item-1');

      expect(restaurantMenuItemFindUnique).toHaveBeenCalledWith({
        where: {
          id: 'restaurant-menu-item-1',
        },
      });

      expect(restaurantMenuItemDelete).toHaveBeenCalledWith({
        where: {
          id: 'restaurant-menu-item-1',
        },
      });

      expect(result).toEqual({
        message: 'Restaurant menu item deleted successfully.',
      });
    });

    it('should throw NotFoundException when item does not exist', async () => {
      restaurantMenuItemFindUnique.mockResolvedValue(null);

      await expect(service.remove('missing-id')).rejects.toThrow(
        new NotFoundException('Restaurant menu item not found'),
      );

      expect(restaurantMenuItemDelete).not.toHaveBeenCalled();
    });
  });
});
