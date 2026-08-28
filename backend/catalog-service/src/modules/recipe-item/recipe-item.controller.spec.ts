import { RecipeItemController } from './recipe-item.controller';
import { RecipeItemService } from './recipe-item.service';

import { CreateRecipeItemDto } from './dto/create-recipe-item.dto';
import { CreateBulkRecipeItemDto } from './dto/create-bulk-recipe-item.dto';
import { UpdateRecipeItemDto } from './dto/update-recipe-item.dto';

describe('RecipeItemController', () => {
  let controller: RecipeItemController;

  const recipeItemServiceMock = {
    create: jest.fn(),
    createBulk: jest.fn(),
    findAllMenuItems: jest.fn(),
    findAllModifiers: jest.fn(),
    findRecipes: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    controller = new RecipeItemController(
      recipeItemServiceMock as unknown as RecipeItemService,
    );
  });

  // ============================================================
  // CREATE ONE
  // POST /recipe-items
  // ============================================================

  describe('create', () => {
    it('should create one recipe item', async () => {
      const createDto: CreateRecipeItemDto = {
        menuItemId: 'menu-item-1',
        ingredientId: 'ingredient-1',
        quantityNeeded: 0.15,
      };

      const serviceResult = {
        id: 'recipe-1',
        menuItemId: 'menu-item-1',
        modifierId: null,
        ingredientId: 'ingredient-1',
        quantityNeeded: 0.15,
      };

      recipeItemServiceMock.create.mockResolvedValue(serviceResult);

      const result = await controller.create(createDto);

      expect(recipeItemServiceMock.create).toHaveBeenCalledWith(createDto);

      expect(result).toEqual({
        message: 'Recipe item created successfully',
        result: serviceResult,
      });
    });
  });

  // ============================================================
  // CREATE BULK
  // POST /recipe-items/bulk
  // ============================================================

  describe('createBulk', () => {
    it('should create multiple recipe items', async () => {
      const createDto: CreateBulkRecipeItemDto = {
        menuItemId: 'menu-item-1',
        recipes: [
          {
            ingredientId: 'ingredient-1',
            quantityNeeded: 0.15,
          },
          {
            ingredientId: 'ingredient-2',
            quantityNeeded: 0.05,
          },
        ],
      };

      const serviceResult = [
        {
          id: 'recipe-1',
          menuItemId: 'menu-item-1',
          modifierId: null,
          ingredientId: 'ingredient-1',
          quantityNeeded: 0.15,
        },
        {
          id: 'recipe-2',
          menuItemId: 'menu-item-1',
          modifierId: null,
          ingredientId: 'ingredient-2',
          quantityNeeded: 0.05,
        },
      ];

      recipeItemServiceMock.createBulk.mockResolvedValue(serviceResult);

      const result = await controller.createBulk(createDto);

      expect(recipeItemServiceMock.createBulk).toHaveBeenCalledWith(createDto);

      expect(result).toEqual({
        message: 'Recipe items created successfully',
        data: serviceResult,
      });
    });

    it('should create bulk recipes for a modifier', async () => {
      const createDto: CreateBulkRecipeItemDto = {
        modifierId: 'modifier-1',
        recipes: [
          {
            ingredientId: 'ingredient-1',
            quantityNeeded: 0.02,
          },
        ],
      };

      const serviceResult = [
        {
          id: 'recipe-3',
          menuItemId: null,
          modifierId: 'modifier-1',
          ingredientId: 'ingredient-1',
          quantityNeeded: 0.02,
        },
      ];

      recipeItemServiceMock.createBulk.mockResolvedValue(serviceResult);

      const result = await controller.createBulk(createDto);

      expect(recipeItemServiceMock.createBulk).toHaveBeenCalledWith(createDto);

      expect(result).toEqual({
        message: 'Recipe items created successfully',
        data: serviceResult,
      });
    });
  });

  // ============================================================
  // FIND ALL MENU ITEMS
  // GET /recipe-items/menu-items
  // ============================================================

  describe('findAllMenuItems', () => {
    it('should return paginated menu item recipes', async () => {
      const serviceResult = {
        data: [
          {
            menuItem: {
              id: 'menu-item-1',
              name: 'Masala Dosa',
              sku: 'DOS-MAS-001',
            },
            ingredients: [
              {
                recipeItemId: 'recipe-1',
                ingredientId: 'ingredient-1',
                name: 'Rice',
                uom: 'kg',
                isActive: true,
                quantityNeeded: 0.15,
              },
            ],
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      recipeItemServiceMock.findAllMenuItems.mockResolvedValue(serviceResult);

      const result = await controller.findAllMenuItems('1', '10');

      expect(recipeItemServiceMock.findAllMenuItems).toHaveBeenCalledWith(
        1,
        10,
      );

      expect(result).toEqual({
        message: 'Menu item recipes retrieved successfully',
        data: serviceResult.data,
        pagination: serviceResult.pagination,
      });
    });

    it('should use page 1 and limit 10 by default', async () => {
      const serviceResult = {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      };

      recipeItemServiceMock.findAllMenuItems.mockResolvedValue(serviceResult);

      const result = await controller.findAllMenuItems();

      expect(recipeItemServiceMock.findAllMenuItems).toHaveBeenCalledWith(
        1,
        10,
      );

      expect(result).toEqual({
        message: 'Menu item recipes retrieved successfully',
        data: [],
        pagination: serviceResult.pagination,
      });
    });
  });

  // ============================================================
  // FIND ALL MODIFIERS
  // GET /recipe-items/modifiers
  // ============================================================

  describe('findAllModifiers', () => {
    it('should return paginated modifier recipes', async () => {
      const serviceResult = {
        data: [
          {
            modifier: {
              id: 'modifier-1',
              name: 'Extra Butter',
              groupId: 'group-1',
            },
            ingredients: [
              {
                recipeItemId: 'recipe-2',
                ingredientId: 'ingredient-2',
                name: 'Butter',
                uom: 'kg',
                isActive: true,
                quantityNeeded: 0.02,
              },
            ],
          },
        ],
        pagination: {
          page: 2,
          limit: 5,
          total: 7,
          totalPages: 2,
        },
      };

      recipeItemServiceMock.findAllModifiers.mockResolvedValue(serviceResult);

      const result = await controller.findAllModifiers('2', '5');

      expect(recipeItemServiceMock.findAllModifiers).toHaveBeenCalledWith(2, 5);

      expect(result).toEqual({
        message: 'Modifier recipes retrieved successfully',
        data: serviceResult.data,
        pagination: serviceResult.pagination,
      });
    });

    it('should use page 1 and limit 10 by default', async () => {
      const serviceResult = {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      };

      recipeItemServiceMock.findAllModifiers.mockResolvedValue(serviceResult);

      const result = await controller.findAllModifiers();

      expect(recipeItemServiceMock.findAllModifiers).toHaveBeenCalledWith(
        1,
        10,
      );

      expect(result).toEqual({
        message: 'Modifier recipes retrieved successfully',
        data: [],
        pagination: serviceResult.pagination,
      });
    });
  });

  // ============================================================
  // FIND MENU ITEM RECIPES
  // GET /recipe-items/menu-items/:menuItemId
  // ============================================================

  describe('findMenuItemRecipes', () => {
    it('should return all recipes for a menu item', async () => {
      const serviceResult = {
        menuItem: {
          id: 'menu-item-1',
          name: 'Masala Dosa',
          sku: 'DOS-MAS-001',
        },
        data: [
          {
            recipeItemId: 'recipe-1',
            ingredientId: 'ingredient-1',
            name: 'Rice',
            uom: 'kg',
            isActive: true,
            quantityNeeded: 0.15,
          },
        ],
      };

      recipeItemServiceMock.findRecipes.mockResolvedValue(serviceResult);

      const result = await controller.findMenuItemRecipes('menu-item-1');

      expect(recipeItemServiceMock.findRecipes).toHaveBeenCalledWith(
        'menu-item-1',
        undefined,
      );

      expect(result).toEqual({
        message: 'Menu item recipes retrieved successfully',
        ...serviceResult,
      });
    });
  });

  // ============================================================
  // FIND MODIFIER RECIPES
  // GET /recipe-items/modifiers/:modifierId
  // ============================================================

  describe('findModifierRecipes', () => {
    it('should return all recipes for a modifier', async () => {
      const serviceResult = {
        modifier: {
          id: 'modifier-1',
          name: 'Extra Butter',
          groupId: 'group-1',
        },
        data: [
          {
            recipeItemId: 'recipe-2',
            ingredientId: 'ingredient-2',
            name: 'Butter',
            uom: 'kg',
            isActive: true,
            quantityNeeded: 0.02,
          },
        ],
      };

      recipeItemServiceMock.findRecipes.mockResolvedValue(serviceResult);

      const result = await controller.findModifierRecipes('modifier-1');

      expect(recipeItemServiceMock.findRecipes).toHaveBeenCalledWith(
        undefined,
        'modifier-1',
      );

      expect(result).toEqual({
        message: 'Modifier recipes retrieved successfully',
        ...serviceResult,
      });
    });
  });

  // ============================================================
  // FIND ONE
  // GET /recipe-items/:id
  // ============================================================

  describe('findOne', () => {
    it('should return one recipe item', async () => {
      const serviceResult = {
        recipeItem: {
          id: 'recipe-1',
          quantityNeeded: 0.15,
        },
        menuItem: {
          id: 'menu-item-1',
          name: 'Masala Dosa',
          sku: 'DOS-MAS-001',
        },
        ingredient: {
          id: 'ingredient-1',
          name: 'Rice',
          uom: 'kg',
          isActive: true,
        },
      };

      recipeItemServiceMock.findOne.mockResolvedValue(serviceResult);

      const result = await controller.findOne('recipe-1');

      expect(recipeItemServiceMock.findOne).toHaveBeenCalledWith('recipe-1');

      expect(result).toEqual({
        message: 'Recipe item retrieved successfully',
        result: serviceResult,
      });
    });
  });

  // ============================================================
  // UPDATE
  // PATCH /recipe-items/:id
  // ============================================================

  describe('update', () => {
    it('should update a recipe item', async () => {
      const updateDto: UpdateRecipeItemDto = {
        quantityNeeded: 0.2,
      };

      const serviceResult = {
        id: 'recipe-1',
        menuItemId: 'menu-item-1',
        modifierId: null,
        ingredientId: 'ingredient-1',
        quantityNeeded: 0.2,
      };

      recipeItemServiceMock.update.mockResolvedValue(serviceResult);

      const result = await controller.update('recipe-1', updateDto);

      expect(recipeItemServiceMock.update).toHaveBeenCalledWith(
        'recipe-1',
        updateDto,
      );

      expect(result).toEqual({
        message: 'Recipe item updated successfully',
        result: serviceResult,
      });
    });
  });

  // ============================================================
  // REMOVE
  // DELETE /recipe-items/:id
  // ============================================================

  describe('remove', () => {
    it('should remove a recipe item', async () => {
      const serviceResult = {
        message: 'Recipe item deleted successfully.',
      };

      recipeItemServiceMock.remove.mockResolvedValue(serviceResult);

      const result = await controller.remove('recipe-1');

      expect(recipeItemServiceMock.remove).toHaveBeenCalledWith('recipe-1');

      expect(result).toEqual(serviceResult);
    });
  });
});
