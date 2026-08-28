import { NotFoundException } from '@nestjs/common';

import { MenuCategoryService } from './menu-category.service.js';
import { PrismaService } from '../../lib/prisma/prisma.service.js';

describe('MenuCategoryService', () => {
  let service: MenuCategoryService;

  const prismaMock = {
    menuCategory: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new MenuCategoryService(prismaMock as unknown as PrismaService);
  });

  // ============================================================
  // CREATE
  // ============================================================

  describe('create', () => {
    it('should create a menu category successfully', async () => {
      const createDto = {
        name: 'South Indian Breakfast',
        sortOrder: 1,
        isActive: true,
      };

      const createdCategory = {
        id: 'category-1',
        name: 'South Indian Breakfast',
        sortOrder: 1,
        isActive: true,
      };

      prismaMock.menuCategory.create.mockResolvedValue(createdCategory);

      const result = await service.create(createDto);

      expect(prismaMock.menuCategory.create).toHaveBeenCalledWith({
        data: createDto,
      });

      expect(result).toEqual(createdCategory);
    });
  });

  // ============================================================
  // FIND ALL
  // ============================================================

  describe('findAll', () => {
    it('should return all menu categories ordered by sortOrder ascending', async () => {
      const categories = [
        {
          id: 'category-1',
          name: 'Breakfast',
          sortOrder: 1,
          isActive: true,
        },
        {
          id: 'category-2',
          name: 'Dosa Specials',
          sortOrder: 2,
          isActive: true,
        },
      ];

      prismaMock.menuCategory.findMany.mockResolvedValue(categories);

      const result = await service.findAll();

      expect(prismaMock.menuCategory.findMany).toHaveBeenCalledWith({
        orderBy: {
          sortOrder: 'asc',
        },
      });

      expect(result).toEqual(categories);
    });

    it('should return an empty array when no categories exist', async () => {
      prismaMock.menuCategory.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  // ============================================================
  // FIND ONE
  // ============================================================

  describe('findOne', () => {
    it('should return menu category when found', async () => {
      const category = {
        id: 'category-1',
        name: 'Dosa Specials',
        sortOrder: 2,
        isActive: true,
      };

      prismaMock.menuCategory.findUnique.mockResolvedValue(category);

      const result = await service.findOne('category-1');

      expect(prismaMock.menuCategory.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'category-1',
        },
      });

      expect(result).toEqual(category);
    });

    it('should throw NotFoundException when category does not exist', async () => {
      prismaMock.menuCategory.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        new NotFoundException('Menu category not found'),
      );
    });
  });

  // ============================================================
  // UPDATE
  // ============================================================

  describe('update', () => {
    it('should update menu category successfully', async () => {
      const existingCategory = {
        id: 'category-1',
        name: 'Dosa Specials',
        sortOrder: 2,
        isActive: true,
      };

      const updateDto = {
        name: 'Dosa & Breakfast Specials',
        sortOrder: 3,
      };

      const updatedCategory = {
        ...existingCategory,
        ...updateDto,
      };

      prismaMock.menuCategory.findUnique.mockResolvedValue(existingCategory);

      prismaMock.menuCategory.update.mockResolvedValue(updatedCategory);

      const result = await service.update('category-1', updateDto);

      expect(prismaMock.menuCategory.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'category-1',
        },
      });

      expect(prismaMock.menuCategory.update).toHaveBeenCalledWith({
        where: {
          id: 'category-1',
        },
        data: updateDto,
      });

      expect(result).toEqual(updatedCategory);
    });

    it('should throw NotFoundException when updating non-existing category', async () => {
      prismaMock.menuCategory.findUnique.mockResolvedValue(null);

      await expect(
        service.update('invalid-id', {
          name: 'New Category',
        }),
      ).rejects.toThrow(new NotFoundException('Menu category not found'));

      expect(prismaMock.menuCategory.update).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // REMOVE / SOFT DELETE
  // ============================================================

  describe('remove', () => {
    it('should deactivate menu category successfully', async () => {
      const existingCategory = {
        id: 'category-1',
        name: 'Dosa Specials',
        sortOrder: 2,
        isActive: true,
      };

      const deactivatedCategory = {
        ...existingCategory,
        isActive: false,
      };

      prismaMock.menuCategory.findUnique.mockResolvedValue(existingCategory);

      prismaMock.menuCategory.update.mockResolvedValue(deactivatedCategory);

      const result = await service.remove('category-1');

      expect(prismaMock.menuCategory.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'category-1',
        },
      });

      expect(prismaMock.menuCategory.update).toHaveBeenCalledWith({
        where: {
          id: 'category-1',
        },
        data: {
          isActive: false,
        },
      });

      expect(result).toEqual(deactivatedCategory);
    });

    it('should throw NotFoundException when removing non-existing category', async () => {
      prismaMock.menuCategory.findUnique.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(
        new NotFoundException('Menu category not found'),
      );

      expect(prismaMock.menuCategory.update).not.toHaveBeenCalled();
    });
  });
});
