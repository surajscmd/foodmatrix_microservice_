import { ConflictException, NotFoundException } from '@nestjs/common';

import { MenuItemService } from './menu-item.service.js';
import { PrismaService } from '../../lib/prisma/prisma.service.js';

describe('MenuItemService', () => {
  let service: MenuItemService;

  const prismaMock = {
    menuCategory: {
      findUnique: jest.fn(),
    },
    menuItem: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new MenuItemService(prismaMock as unknown as PrismaService);
  });

  // ============================================================
  // CREATE
  // ============================================================

  describe('create', () => {
    const createDto = {
      categoryId: 'category-1',
      name: 'Masala Dosa',
      sku: 'DOS-MAS-001',
      description: 'Crispy dosa filled with potato masala.',
      basePrice: 139,
      isAvailable: true,
    };

    const category = {
      id: 'category-1',
      name: 'Dosa Specials',
      sortOrder: 2,
      isActive: true,
    };

    const createdItem = {
      id: 'menu-item-1',
      ...createDto,
      category,
    };

    it('should create menu item successfully', async () => {
      prismaMock.menuCategory.findUnique.mockResolvedValue(category);
      prismaMock.menuItem.findUnique.mockResolvedValue(null);
      prismaMock.menuItem.create.mockResolvedValue(createdItem);

      const result = await service.create(createDto);

      expect(prismaMock.menuCategory.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'category-1',
        },
      });

      expect(prismaMock.menuItem.findUnique).toHaveBeenCalledWith({
        where: {
          sku: 'DOS-MAS-001',
        },
      });

      expect(prismaMock.menuItem.create).toHaveBeenCalledWith({
        data: {
          categoryId: 'category-1',
          name: 'Masala Dosa',
          sku: 'DOS-MAS-001',
          description: 'Crispy dosa filled with potato masala.',
          basePrice: 139,
          isAvailable: true,
        },
        include: {
          category: true,
        },
      });

      expect(result).toEqual(createdItem);
    });

    it('should set isAvailable to true when it is not provided', async () => {
      const dtoWithoutAvailability = {
        categoryId: 'category-1',
        name: 'Idli',
        sku: 'SID-IDL-001',
        description: 'Soft steamed rice cakes.',
        basePrice: 79,
      };

      const resultItem = {
        id: 'menu-item-2',
        ...dtoWithoutAvailability,
        isAvailable: true,
        category,
      };

      prismaMock.menuCategory.findUnique.mockResolvedValue(category);
      prismaMock.menuItem.findUnique.mockResolvedValue(null);
      prismaMock.menuItem.create.mockResolvedValue(resultItem);

      const result = await service.create(dtoWithoutAvailability);

      expect(prismaMock.menuItem.create).toHaveBeenCalledWith({
        data: {
          categoryId: 'category-1',
          name: 'Idli',
          sku: 'SID-IDL-001',
          description: 'Soft steamed rice cakes.',
          basePrice: 79,
          isAvailable: true,
        },
        include: {
          category: true,
        },
      });

      expect(result).toEqual(resultItem);
    });

    it('should throw NotFoundException when category does not exist', async () => {
      prismaMock.menuCategory.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        new NotFoundException('Menu category not found'),
      );

      expect(prismaMock.menuItem.findUnique).not.toHaveBeenCalled();

      expect(prismaMock.menuItem.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when category is inactive', async () => {
      prismaMock.menuCategory.findUnique.mockResolvedValue({
        ...category,
        isActive: false,
      });

      await expect(service.create(createDto)).rejects.toThrow(
        new ConflictException(
          'Cannot create menu item under an inactive category',
        ),
      );

      expect(prismaMock.menuItem.findUnique).not.toHaveBeenCalled();

      expect(prismaMock.menuItem.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when SKU already exists', async () => {
      prismaMock.menuCategory.findUnique.mockResolvedValue(category);

      prismaMock.menuItem.findUnique.mockResolvedValue({
        id: 'existing-item',
        sku: 'DOS-MAS-001',
      });

      await expect(service.create(createDto)).rejects.toThrow(
        new ConflictException('Menu item with this SKU already exists'),
      );

      expect(prismaMock.menuItem.create).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // FIND ALL
  // ============================================================

  describe('findAll', () => {
    it('should return paginated menu items', async () => {
      const menuItems = [
        {
          id: 'item-1',
          name: 'Masala Dosa',
          sku: 'DOS-MAS-001',
          basePrice: 139,
          category: {
            id: 'category-1',
            name: 'Dosa Specials',
          },
        },
        {
          id: 'item-2',
          name: 'Plain Dosa',
          sku: 'DOS-PLA-001',
          basePrice: 99,
          category: {
            id: 'category-1',
            name: 'Dosa Specials',
          },
        },
      ];

      prismaMock.menuItem.findMany.mockResolvedValue(menuItems);
      prismaMock.menuItem.count.mockResolvedValue(25);

      const result = await service.findAll(2, 10);

      expect(prismaMock.menuItem.findMany).toHaveBeenCalledWith({
        skip: 10,
        take: 10,
        include: {
          category: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      expect(prismaMock.menuItem.count).toHaveBeenCalledWith();

      expect(result).toEqual({
        data: menuItems,
        pagination: {
          page: 2,
          limit: 10,
          total: 25,
          totalPages: 3,
        },
      });
    });

    it('should use page 1 and limit 10 by default', async () => {
      prismaMock.menuItem.findMany.mockResolvedValue([]);
      prismaMock.menuItem.count.mockResolvedValue(0);

      const result = await service.findAll();

      expect(prismaMock.menuItem.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        include: {
          category: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

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

    it('should correctly calculate skip for different page and limit', async () => {
      prismaMock.menuItem.findMany.mockResolvedValue([]);
      prismaMock.menuItem.count.mockResolvedValue(100);

      await service.findAll(4, 25);

      expect(prismaMock.menuItem.findMany).toHaveBeenCalledWith({
        skip: 75,
        take: 25,
        include: {
          category: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });
  });

  // ============================================================
  // FIND ONE
  // ============================================================

  describe('findOne', () => {
    it('should return menu item with category, modifiers and recipe', async () => {
      const item = {
        id: 'menu-item-1',
        name: 'Masala Dosa',
        sku: 'DOS-MAS-001',
        basePrice: 139,
        category: {
          id: 'category-1',
          name: 'Dosa Specials',
        },
        modifierGroups: [
          {
            group: {
              id: 'group-1',
              name: 'Dosa Extras',
            },
          },
        ],
        recipe: [
          {
            ingredient: {
              id: 'ingredient-1',
              name: 'Rice',
            },
          },
        ],
      };

      prismaMock.menuItem.findUnique.mockResolvedValue(item);

      const result = await service.findOne('menu-item-1');

      expect(prismaMock.menuItem.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'menu-item-1',
        },
        include: {
          category: true,
          modifierGroups: {
            include: {
              group: true,
            },
          },
          recipe: {
            include: {
              ingredient: true,
            },
          },
        },
      });

      expect(result).toEqual(item);
    });

    it('should throw NotFoundException when menu item does not exist', async () => {
      prismaMock.menuItem.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        new NotFoundException('Menu item not found'),
      );
    });
  });

  // ============================================================
  // FIND BY CATEGORY
  // ============================================================

  describe('findByCategory', () => {
    it('should return category once and all its menu items', async () => {
      const category = {
        id: 'category-1',
        name: 'South Indian Breakfast',
        sortOrder: 1,
        isActive: true,
      };

      const menuItems = [
        {
          id: 'item-1',
          categoryId: 'category-1',
          name: 'Idli',
          sku: 'SID-IDL-001',
          basePrice: 79,
        },
        {
          id: 'item-2',
          categoryId: 'category-1',
          name: 'Set Dosa',
          sku: 'SID-DOS-001',
          basePrice: 129,
        },
      ];

      prismaMock.menuCategory.findUnique.mockResolvedValue(category);
      prismaMock.menuItem.findMany.mockResolvedValue(menuItems);

      const result = await service.findByCategory('category-1');

      expect(prismaMock.menuCategory.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'category-1',
        },
      });

      expect(prismaMock.menuItem.findMany).toHaveBeenCalledWith({
        where: {
          categoryId: 'category-1',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      expect(result).toEqual({
        category,
        data: menuItems,
      });
    });

    it('should throw NotFoundException when category does not exist', async () => {
      prismaMock.menuCategory.findUnique.mockResolvedValue(null);

      await expect(service.findByCategory('invalid-category')).rejects.toThrow(
        new NotFoundException('Menu category not found'),
      );

      expect(prismaMock.menuItem.findMany).not.toHaveBeenCalled();
    });

    it('should return empty data when category has no menu items', async () => {
      const category = {
        id: 'category-1',
        name: 'Desserts',
        sortOrder: 12,
        isActive: true,
      };

      prismaMock.menuCategory.findUnique.mockResolvedValue(category);
      prismaMock.menuItem.findMany.mockResolvedValue([]);

      const result = await service.findByCategory('category-1');

      expect(result).toEqual({
        category,
        data: [],
      });
    });
  });

  // ============================================================
  // UPDATE
  // ============================================================

  describe('update', () => {
    const existingItem = {
      id: 'menu-item-1',
      categoryId: 'category-1',
      name: 'Plain Dosa',
      sku: 'DOS-PLA-001',
      basePrice: 99,
      isAvailable: true,
    };

    it('should update menu item successfully', async () => {
      const updateDto = {
        name: 'Crispy Plain Dosa',
        basePrice: 109,
      };

      const updatedItem = {
        ...existingItem,
        ...updateDto,
        category: {
          id: 'category-1',
          name: 'Dosa Specials',
        },
      };

      prismaMock.menuItem.findUnique.mockResolvedValue(existingItem);
      prismaMock.menuItem.update.mockResolvedValue(updatedItem);

      const result = await service.update('menu-item-1', updateDto);

      expect(prismaMock.menuItem.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'menu-item-1',
        },
        include: {
          category: true,
          modifierGroups: {
            include: {
              group: true,
            },
          },
          recipe: {
            include: {
              ingredient: true,
            },
          },
        },
      });

      expect(prismaMock.menuItem.update).toHaveBeenCalledWith({
        where: {
          id: 'menu-item-1',
        },
        data: updateDto,
        include: {
          category: true,
        },
      });

      expect(result).toEqual(updatedItem);
    });

    it('should update category when a valid active category is provided', async () => {
      const updateDto = {
        categoryId: 'category-2',
      };

      const newCategory = {
        id: 'category-2',
        name: 'Biryani & Rice',
        sortOrder: 7,
        isActive: true,
      };

      const updatedItem = {
        ...existingItem,
        categoryId: 'category-2',
        category: newCategory,
      };

      prismaMock.menuItem.findUnique.mockResolvedValue(existingItem);
      prismaMock.menuCategory.findUnique.mockResolvedValue(newCategory);
      prismaMock.menuItem.update.mockResolvedValue(updatedItem);

      const result = await service.update('menu-item-1', updateDto);

      expect(prismaMock.menuCategory.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'category-2',
        },
      });

      expect(result).toEqual(updatedItem);
    });

    it('should throw NotFoundException when updating with non-existing category', async () => {
      const updateDto = {
        categoryId: 'invalid-category',
      };

      prismaMock.menuItem.findUnique.mockResolvedValue(existingItem);
      prismaMock.menuCategory.findUnique.mockResolvedValue(null);

      await expect(service.update('menu-item-1', updateDto)).rejects.toThrow(
        new NotFoundException('Menu category not found'),
      );

      expect(prismaMock.menuItem.update).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when updating to an inactive category', async () => {
      const updateDto = {
        categoryId: 'category-2',
      };

      prismaMock.menuItem.findUnique.mockResolvedValue(existingItem);
      prismaMock.menuCategory.findUnique.mockResolvedValue({
        id: 'category-2',
        name: 'Inactive Category',
        sortOrder: 9,
        isActive: false,
      });

      await expect(service.update('menu-item-1', updateDto)).rejects.toThrow(
        new ConflictException(
          'Cannot assign menu item to an inactive category',
        ),
      );

      expect(prismaMock.menuItem.update).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when SKU already belongs to another item', async () => {
      const updateDto = {
        sku: 'DOS-MAS-001',
      };

      prismaMock.menuItem.findUnique.mockResolvedValue(existingItem);

      prismaMock.menuItem.findFirst.mockResolvedValue({
        id: 'another-item',
        sku: 'DOS-MAS-001',
      });

      await expect(service.update('menu-item-1', updateDto)).rejects.toThrow(
        new ConflictException('Menu item with this SKU already exists'),
      );

      expect(prismaMock.menuItem.update).not.toHaveBeenCalled();
    });

    it('should update SKU when the new SKU is unique', async () => {
      const updateDto = {
        sku: 'DOS-NEW-001',
      };

      const updatedItem = {
        ...existingItem,
        sku: 'DOS-NEW-001',
        category: {
          id: 'category-1',
          name: 'Dosa Specials',
        },
      };

      prismaMock.menuItem.findUnique.mockResolvedValue(existingItem);
      prismaMock.menuItem.findFirst.mockResolvedValue(null);
      prismaMock.menuItem.update.mockResolvedValue(updatedItem);

      const result = await service.update('menu-item-1', updateDto);

      expect(prismaMock.menuItem.findFirst).toHaveBeenCalledWith({
        where: {
          sku: 'DOS-NEW-001',
          NOT: {
            id: 'menu-item-1',
          },
        },
      });

      expect(result).toEqual(updatedItem);
    });

    it('should throw NotFoundException when updating non-existing menu item', async () => {
      prismaMock.menuItem.findUnique.mockResolvedValue(null);

      await expect(
        service.update('invalid-id', {
          name: 'Updated Item',
        }),
      ).rejects.toThrow(new NotFoundException('Menu item not found'));

      expect(prismaMock.menuItem.update).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // REMOVE / SOFT DELETE
  // ============================================================

  describe('remove', () => {
    it('should make menu item unavailable successfully', async () => {
      const existingItem = {
        id: 'menu-item-1',
        categoryId: 'category-1',
        name: 'Masala Dosa',
        sku: 'DOS-MAS-001',
        basePrice: 139,
        isAvailable: true,
      };

      const removedItem = {
        ...existingItem,
        isAvailable: false,
      };

      prismaMock.menuItem.findUnique.mockResolvedValue(existingItem);
      prismaMock.menuItem.update.mockResolvedValue(removedItem);

      const result = await service.remove('menu-item-1');

      expect(prismaMock.menuItem.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'menu-item-1',
        },
        include: {
          category: true,
          modifierGroups: {
            include: {
              group: true,
            },
          },
          recipe: {
            include: {
              ingredient: true,
            },
          },
        },
      });

      expect(prismaMock.menuItem.update).toHaveBeenCalledWith({
        where: {
          id: 'menu-item-1',
        },
        data: {
          isAvailable: false,
        },
      });

      expect(result).toEqual(removedItem);
    });

    it('should throw NotFoundException when removing non-existing menu item', async () => {
      prismaMock.menuItem.findUnique.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(
        new NotFoundException('Menu item not found'),
      );

      expect(prismaMock.menuItem.update).not.toHaveBeenCalled();
    });
  });
});
