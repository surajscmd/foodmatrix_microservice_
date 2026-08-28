import { IngredientController } from './ingredient.controller.js';
import { IngredientService } from './ingredient.service.js';

describe('IngredientController', () => {
  let controller: IngredientController;

  const ingredientServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    controller = new IngredientController(
      ingredientServiceMock as unknown as IngredientService,
    );
  });

  // ============================================================
  // CREATE
  // ============================================================

  describe('create', () => {
    it('should create an ingredient successfully', async () => {
      const createDto = {
        name: 'Rice',
        uom: 'kg',
        isActive: true,
      };

      const ingredient = {
        id: 'ingredient-1',
        name: 'Rice',
        uom: 'kg',
        isActive: true,
      };

      ingredientServiceMock.create.mockResolvedValue(ingredient);

      const result = await controller.create(createDto);

      expect(ingredientServiceMock.create).toHaveBeenCalledWith(createDto);

      expect(result).toEqual({
        message: 'Ingredient created successfully',
        data: ingredient,
      });
    });
  });

  // ============================================================
  // FIND ALL
  // ============================================================

  it('should return paginated ingredients', async () => {
    const serviceResult = {
      data: [
        {
          id: 'ingredient-1',
          name: 'Rice',
          uom: 'kg',
          isActive: true,
        },
      ],
      pagination: {
        page: 2,
        limit: 10,
        totalItems: 47,
        totalPages: 5,
        hasNextPage: true,
        hasPreviousPage: true,
      },
    };

    ingredientServiceMock.findAll.mockResolvedValue(serviceResult);

    const result = await controller.findAll('2', '10');

    expect(ingredientServiceMock.findAll).toHaveBeenCalledWith(2, 10);

    expect(result).toEqual({
      message: 'Ingredients fetched successfully',
      ...serviceResult,
    });
  });
  // ============================================================
  // FIND ONE
  // ============================================================

  describe('findOne', () => {
    it('should return one ingredient', async () => {
      const ingredient = {
        id: 'ingredient-1',
        name: 'Rice',
        uom: 'kg',
        isActive: true,
      };

      ingredientServiceMock.findOne.mockResolvedValue(ingredient);

      const result = await controller.findOne('ingredient-1');

      expect(ingredientServiceMock.findOne).toHaveBeenCalledWith(
        'ingredient-1',
      );

      expect(result).toEqual({
        message: 'Ingredient fetched successfully',
        data: ingredient,
      });
    });
  });

  // ============================================================
  // UPDATE
  // ============================================================

  describe('update', () => {
    it('should update an ingredient successfully', async () => {
      const updateDto = {
        name: 'Basmati Rice',
        uom: 'kg',
      };

      const updatedIngredient = {
        id: 'ingredient-1',
        name: 'Basmati Rice',
        uom: 'kg',
        isActive: true,
      };

      ingredientServiceMock.update.mockResolvedValue(updatedIngredient);

      const result = await controller.update('ingredient-1', updateDto);

      expect(ingredientServiceMock.update).toHaveBeenCalledWith(
        'ingredient-1',
        updateDto,
      );

      expect(result).toEqual({
        message: 'Ingredient updated successfully',
        data: updatedIngredient,
      });
    });
  });

  // ============================================================
  // REMOVE
  // ============================================================

  describe('remove', () => {
    it('should deactivate an ingredient successfully', async () => {
      const deactivatedIngredient = {
        id: 'ingredient-1',
        name: 'Rice',
        uom: 'kg',
        isActive: false,
      };

      ingredientServiceMock.remove.mockResolvedValue(deactivatedIngredient);

      const result = await controller.remove('ingredient-1');

      expect(ingredientServiceMock.remove).toHaveBeenCalledWith('ingredient-1');

      expect(result).toEqual({
        message: 'Ingredient deactivated successfully',
        data: deactivatedIngredient,
      });
    });
  });
});
