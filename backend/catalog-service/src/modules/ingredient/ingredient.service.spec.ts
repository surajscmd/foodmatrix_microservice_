import { ConflictException, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../lib/prisma/prisma.service.js';
import { IngredientService } from './ingredient.service.js';

describe('IngredientService', () => {
  let service: IngredientService;

  const prismaMock = {
    ingredient: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new IngredientService(prismaMock as unknown as PrismaService);
  });

  // ============================================================
  // CREATE
  // ============================================================

  describe('create', () => {
    it('should create an ingredient successfully', async () => {
      const dto = {
        name: 'Rice',
        uom: 'kg',
        isActive: true,
      };

      const createdIngredient = {
        id: 'ingredient-1',
        name: 'Rice',
        uom: 'kg',
        isActive: true,
      };

      prismaMock.ingredient.findFirst.mockResolvedValue(null);
      prismaMock.ingredient.create.mockResolvedValue(createdIngredient);

      const result = await service.create(dto);

      expect(prismaMock.ingredient.findFirst).toHaveBeenCalledWith({
        where: {
          name: 'Rice',
        },
      });

      expect(prismaMock.ingredient.create).toHaveBeenCalledWith({
        data: {
          name: 'Rice',
          uom: 'kg',
          isActive: true,
        },
      });

      expect(result).toEqual(createdIngredient);
    });

    it('should set isActive to true when it is not provided', async () => {
      const dto = {
        name: 'Sugar',
        uom: 'kg',
      };

      const createdIngredient = {
        id: 'ingredient-2',
        name: 'Sugar',
        uom: 'kg',
        isActive: true,
      };

      prismaMock.ingredient.findFirst.mockResolvedValue(null);
      prismaMock.ingredient.create.mockResolvedValue(createdIngredient);

      const result = await service.create(dto);

      expect(prismaMock.ingredient.create).toHaveBeenCalledWith({
        data: {
          name: 'Sugar',
          uom: 'kg',
          isActive: true,
        },
      });

      expect(result).toEqual(createdIngredient);
    });

    it('should throw ConflictException when ingredient already exists', async () => {
      const dto = {
        name: 'Rice',
        uom: 'kg',
      };

      prismaMock.ingredient.findFirst.mockResolvedValue({
        id: 'existing-id',
        name: 'Rice',
        uom: 'kg',
        isActive: true,
      });

      await expect(service.create(dto)).rejects.toThrow(
        new ConflictException('Ingredient with this name already exists'),
      );

      expect(prismaMock.ingredient.create).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // FIND ALL
  // ============================================================

  describe('IngredientService', () => {
    let service: IngredientService;

    const prismaMock = {
      $transaction: (queries: Promise<unknown>[]) => Promise.all(queries),
      ingredient: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
    };

    beforeEach(() => {
      jest.clearAllMocks();

      service = new IngredientService(prismaMock as unknown as PrismaService);
    });

    // ============================================================
    // CREATE
    // ============================================================

    describe('create', () => {
      it('should create an ingredient successfully', async () => {
        const dto = {
          name: 'Rice',
          uom: 'kg',
          isActive: true,
        };

        const createdIngredient = {
          id: 'ingredient-1',
          name: 'Rice',
          uom: 'kg',
          isActive: true,
        };

        prismaMock.ingredient.findFirst.mockResolvedValue(null);
        prismaMock.ingredient.create.mockResolvedValue(createdIngredient);

        const result = await service.create(dto);

        expect(prismaMock.ingredient.findFirst).toHaveBeenCalledWith({
          where: {
            name: 'Rice',
          },
        });

        expect(prismaMock.ingredient.create).toHaveBeenCalledWith({
          data: {
            name: 'Rice',
            uom: 'kg',
            isActive: true,
          },
        });

        expect(result).toEqual(createdIngredient);
      });

      it('should set isActive to true when it is not provided', async () => {
        const dto = {
          name: 'Sugar',
          uom: 'kg',
        };

        const createdIngredient = {
          id: 'ingredient-2',
          name: 'Sugar',
          uom: 'kg',
          isActive: true,
        };

        prismaMock.ingredient.findFirst.mockResolvedValue(null);
        prismaMock.ingredient.create.mockResolvedValue(createdIngredient);

        const result = await service.create(dto);

        expect(prismaMock.ingredient.create).toHaveBeenCalledWith({
          data: {
            name: 'Sugar',
            uom: 'kg',
            isActive: true,
          },
        });

        expect(result).toEqual(createdIngredient);
      });

      it('should throw ConflictException when ingredient already exists', async () => {
        const dto = {
          name: 'Rice',
          uom: 'kg',
        };

        prismaMock.ingredient.findFirst.mockResolvedValue({
          id: 'existing-id',
          name: 'Rice',
          uom: 'kg',
          isActive: true,
        });

        await expect(service.create(dto)).rejects.toThrow(
          new ConflictException('Ingredient with this name already exists'),
        );

        expect(prismaMock.ingredient.create).not.toHaveBeenCalled();
      });
    });

    // ============================================================
    // FIND ALL
    // ============================================================

    describe('findAll', () => {
      it('should return paginated ingredients', async () => {
        const ingredients = [
          {
            id: 'ingredient-1',
            name: 'Rice',
            uom: 'kg',
            isActive: true,
          },
          {
            id: 'ingredient-2',
            name: 'Chicken',
            uom: 'kg',
            isActive: true,
          },
        ];

        prismaMock.ingredient.findMany.mockResolvedValue(ingredients);

        prismaMock.ingredient.count.mockResolvedValue(47);

        const result = await service.findAll(2, 10);

        expect(prismaMock.ingredient.findMany).toHaveBeenCalledWith({
          where: {},
          skip: 10,
          take: 10,
          orderBy: {
            name: 'asc',
          },
        });

        expect(prismaMock.ingredient.count).toHaveBeenCalledWith({ where: {} });

        expect(result).toEqual({
          data: ingredients,
          page: 2,
          limit: 10,
          total: 47,
          totalPages: 5,
        });
      });

      it('should use page 1 and limit 10 by default', async () => {
        prismaMock.ingredient.findMany.mockResolvedValue([]);
        prismaMock.ingredient.count.mockResolvedValue(0);

        const result = await service.findAll();

        expect(prismaMock.ingredient.findMany).toHaveBeenCalledWith({
          where: {},
          skip: 0,
          take: 10,
          orderBy: {
            name: 'asc',
          },
        });

        expect(prismaMock.ingredient.count).toHaveBeenCalledWith({ where: {} });

        expect(result).toEqual({
          data: [],
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        });
      });

      it('should correctly identify the last page', async () => {
        prismaMock.ingredient.findMany.mockResolvedValue([]);
        prismaMock.ingredient.count.mockResolvedValue(47);

        const result = await service.findAll(5, 10);

        expect(result).toEqual({
          data: [],
          page: 5,
          limit: 10,
          total: 47,
          totalPages: 5,
        });
      });

      it('should correctly calculate skip for different pages', async () => {
        prismaMock.ingredient.findMany.mockResolvedValue([]);
        prismaMock.ingredient.count.mockResolvedValue(100);

        await service.findAll(4, 25);

        expect(prismaMock.ingredient.findMany).toHaveBeenCalledWith({
          where: {},
          skip: 75,
          take: 25,
          orderBy: {
            name: 'asc',
          },
        });
      });
    });

    // ============================================================
    // FIND ONE
    // ============================================================

    describe('findOne', () => {
      it('should return ingredient when found', async () => {
        const ingredient = {
          id: 'ingredient-1',
          name: 'Rice',
          uom: 'kg',
          isActive: true,
        };

        prismaMock.ingredient.findUnique.mockResolvedValue(ingredient);

        const result = await service.findOne('ingredient-1');

        expect(prismaMock.ingredient.findUnique).toHaveBeenCalledWith({
          where: {
            id: 'ingredient-1',
          },
        });

        expect(result).toEqual(ingredient);
      });

      it('should throw NotFoundException when ingredient does not exist', async () => {
        prismaMock.ingredient.findUnique.mockResolvedValue(null);

        await expect(service.findOne('invalid-id')).rejects.toThrow(
          new NotFoundException('Ingredient not found'),
        );
      });
    });

    // ============================================================
    // UPDATE
    // ============================================================

    describe('update', () => {
      it('should update ingredient successfully', async () => {
        const existingIngredient = {
          id: 'ingredient-1',
          name: 'Rice',
          uom: 'kg',
          isActive: true,
        };

        const updateDto = {
          name: 'Basmati Rice',
          uom: 'kg',
        };

        const updatedIngredient = {
          ...existingIngredient,
          name: 'Basmati Rice',
        };

        prismaMock.ingredient.findUnique.mockResolvedValue(existingIngredient);

        prismaMock.ingredient.findFirst.mockResolvedValue(null);

        prismaMock.ingredient.update.mockResolvedValue(updatedIngredient);

        const result = await service.update('ingredient-1', updateDto);

        expect(prismaMock.ingredient.findUnique).toHaveBeenCalledWith({
          where: {
            id: 'ingredient-1',
          },
        });

        expect(prismaMock.ingredient.findFirst).toHaveBeenCalledWith({
          where: {
            name: 'Basmati Rice',
            NOT: {
              id: 'ingredient-1',
            },
          },
        });

        expect(prismaMock.ingredient.update).toHaveBeenCalledWith({
          where: {
            id: 'ingredient-1',
          },
          data: updateDto,
        });

        expect(result).toEqual(updatedIngredient);
      });

      it('should update ingredient without checking duplicate name when name is not provided', async () => {
        const existingIngredient = {
          id: 'ingredient-1',
          name: 'Rice',
          uom: 'kg',
          isActive: true,
        };

        const updateDto = {
          uom: 'gram',
        };

        const updatedIngredient = {
          ...existingIngredient,
          uom: 'gram',
        };

        prismaMock.ingredient.findUnique.mockResolvedValue(existingIngredient);

        prismaMock.ingredient.update.mockResolvedValue(updatedIngredient);

        const result = await service.update('ingredient-1', updateDto);

        expect(prismaMock.ingredient.findFirst).not.toHaveBeenCalled();

        expect(prismaMock.ingredient.update).toHaveBeenCalledWith({
          where: {
            id: 'ingredient-1',
          },
          data: updateDto,
        });

        expect(result).toEqual(updatedIngredient);
      });

      it('should throw ConflictException when new name already exists', async () => {
        const existingIngredient = {
          id: 'ingredient-1',
          name: 'Rice',
          uom: 'kg',
          isActive: true,
        };

        const updateDto = {
          name: 'Chicken',
        };

        prismaMock.ingredient.findUnique.mockResolvedValue(existingIngredient);

        prismaMock.ingredient.findFirst.mockResolvedValue({
          id: 'ingredient-2',
          name: 'Chicken',
          uom: 'kg',
          isActive: true,
        });

        await expect(service.update('ingredient-1', updateDto)).rejects.toThrow(
          new ConflictException('Ingredient with this name already exists'),
        );

        expect(prismaMock.ingredient.update).not.toHaveBeenCalled();
      });

      it('should throw NotFoundException when updating non-existing ingredient', async () => {
        prismaMock.ingredient.findUnique.mockResolvedValue(null);

        await expect(
          service.update('invalid-id', {
            name: 'Rice',
          }),
        ).rejects.toThrow(new NotFoundException('Ingredient not found'));

        expect(prismaMock.ingredient.update).not.toHaveBeenCalled();
      });
    });

    // ============================================================
    // REMOVE / SOFT DELETE
    // ============================================================

    describe('remove', () => {
      it('should soft delete ingredient successfully', async () => {
        const existingIngredient = {
          id: 'ingredient-1',
          name: 'Rice',
          uom: 'kg',
          isActive: true,
        };

        const deletedIngredient = {
          ...existingIngredient,
          isActive: false,
        };

        prismaMock.ingredient.findUnique.mockResolvedValue(existingIngredient);

        prismaMock.ingredient.update.mockResolvedValue(deletedIngredient);

        const result = await service.remove('ingredient-1');

        expect(prismaMock.ingredient.findUnique).toHaveBeenCalledWith({
          where: {
            id: 'ingredient-1',
          },
        });

        expect(prismaMock.ingredient.update).toHaveBeenCalledWith({
          where: {
            id: 'ingredient-1',
          },
          data: {
            isActive: false,
          },
        });

        expect(result).toEqual(deletedIngredient);
      });

      it('should throw NotFoundException when removing non-existing ingredient', async () => {
        prismaMock.ingredient.findUnique.mockResolvedValue(null);

        await expect(service.remove('invalid-id')).rejects.toThrow(
          new NotFoundException('Ingredient not found'),
        );

        expect(prismaMock.ingredient.update).not.toHaveBeenCalled();
      });
    });
  });
  // ============================================================
  // FIND ONE
  // ============================================================

  describe('findOne', () => {
    it('should return ingredient when found', async () => {
      const ingredient = {
        id: 'ingredient-1',
        name: 'Rice',
        uom: 'kg',
        isActive: true,
      };

      prismaMock.ingredient.findUnique.mockResolvedValue(ingredient);

      const result = await service.findOne('ingredient-1');

      expect(prismaMock.ingredient.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'ingredient-1',
        },
      });

      expect(result).toEqual(ingredient);
    });

    it('should throw NotFoundException when ingredient does not exist', async () => {
      prismaMock.ingredient.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        new NotFoundException('Ingredient not found'),
      );
    });
  });

  // ============================================================
  // UPDATE
  // ============================================================

  describe('update', () => {
    it('should update ingredient successfully', async () => {
      const existingIngredient = {
        id: 'ingredient-1',
        name: 'Rice',
        uom: 'kg',
        isActive: true,
      };

      const updateDto = {
        name: 'Basmati Rice',
        uom: 'kg',
      };

      const updatedIngredient = {
        ...existingIngredient,
        name: 'Basmati Rice',
      };

      // First findOne()
      prismaMock.ingredient.findUnique.mockResolvedValue(existingIngredient);

      // Duplicate-name check
      prismaMock.ingredient.findFirst.mockResolvedValue(null);

      prismaMock.ingredient.update.mockResolvedValue(updatedIngredient);

      const result = await service.update('ingredient-1', updateDto);

      expect(prismaMock.ingredient.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'ingredient-1',
        },
      });

      expect(prismaMock.ingredient.findFirst).toHaveBeenCalledWith({
        where: {
          name: 'Basmati Rice',
          NOT: {
            id: 'ingredient-1',
          },
        },
      });

      expect(prismaMock.ingredient.update).toHaveBeenCalledWith({
        where: {
          id: 'ingredient-1',
        },
        data: updateDto,
      });

      expect(result).toEqual(updatedIngredient);
    });

    it('should update ingredient without checking duplicate name when name is not provided', async () => {
      const existingIngredient = {
        id: 'ingredient-1',
        name: 'Rice',
        uom: 'kg',
        isActive: true,
      };

      const updateDto = {
        uom: 'gram',
      };

      const updatedIngredient = {
        ...existingIngredient,
        uom: 'gram',
      };

      prismaMock.ingredient.findUnique.mockResolvedValue(existingIngredient);

      prismaMock.ingredient.update.mockResolvedValue(updatedIngredient);

      const result = await service.update('ingredient-1', updateDto);

      expect(prismaMock.ingredient.findFirst).not.toHaveBeenCalled();

      expect(prismaMock.ingredient.update).toHaveBeenCalledWith({
        where: {
          id: 'ingredient-1',
        },
        data: updateDto,
      });

      expect(result).toEqual(updatedIngredient);
    });

    it('should throw ConflictException when new name already exists', async () => {
      const existingIngredient = {
        id: 'ingredient-1',
        name: 'Rice',
        uom: 'kg',
        isActive: true,
      };

      const updateDto = {
        name: 'Chicken',
      };

      prismaMock.ingredient.findUnique.mockResolvedValue(existingIngredient);

      prismaMock.ingredient.findFirst.mockResolvedValue({
        id: 'ingredient-2',
        name: 'Chicken',
        uom: 'kg',
        isActive: true,
      });

      await expect(service.update('ingredient-1', updateDto)).rejects.toThrow(
        new ConflictException('Ingredient with this name already exists'),
      );

      expect(prismaMock.ingredient.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when updating non-existing ingredient', async () => {
      prismaMock.ingredient.findUnique.mockResolvedValue(null);

      await expect(
        service.update('invalid-id', {
          name: 'Rice',
        }),
      ).rejects.toThrow(new NotFoundException('Ingredient not found'));

      expect(prismaMock.ingredient.update).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // REMOVE / SOFT DELETE
  // ============================================================

  describe('remove', () => {
    it('should soft delete ingredient successfully', async () => {
      const existingIngredient = {
        id: 'ingredient-1',
        name: 'Rice',
        uom: 'kg',
        isActive: true,
      };

      const deletedIngredient = {
        ...existingIngredient,
        isActive: false,
      };

      prismaMock.ingredient.findUnique.mockResolvedValue(existingIngredient);

      prismaMock.ingredient.update.mockResolvedValue(deletedIngredient);

      const result = await service.remove('ingredient-1');

      expect(prismaMock.ingredient.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'ingredient-1',
        },
      });

      expect(prismaMock.ingredient.update).toHaveBeenCalledWith({
        where: {
          id: 'ingredient-1',
        },
        data: {
          isActive: false,
        },
      });

      expect(result).toEqual(deletedIngredient);
    });

    it('should throw NotFoundException when removing non-existing ingredient', async () => {
      prismaMock.ingredient.findUnique.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(
        new NotFoundException('Ingredient not found'),
      );

      expect(prismaMock.ingredient.update).not.toHaveBeenCalled();
    });
  });
});
