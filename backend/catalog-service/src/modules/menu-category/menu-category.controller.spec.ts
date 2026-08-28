import { MenuCategoryController } from './menu-category.controller.js';
import { MenuCategoryService } from './menu-category.service.js';

describe('MenuCategoryController', () => {
  let controller: MenuCategoryController;

  const menuCategoryServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    controller = new MenuCategoryController(
      menuCategoryServiceMock as unknown as MenuCategoryService,
    );
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

      const category = {
        id: 'category-1',
        name: 'South Indian Breakfast',
        sortOrder: 1,
        isActive: true,
      };

      menuCategoryServiceMock.create.mockResolvedValue(category);

      const result = await controller.create(createDto);

      expect(menuCategoryServiceMock.create).toHaveBeenCalledWith(createDto);

      expect(result).toEqual({
        message: 'Menu category created successfully',
        data: category,
      });
    });
  });

  // ============================================================
  // FIND ALL
  // ============================================================

  describe('findAll', () => {
    it('should return all menu categories', async () => {
      const categories = [
        {
          id: 'category-1',
          name: 'South Indian Breakfast',
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

      menuCategoryServiceMock.findAll.mockResolvedValue(categories);

      const result = await controller.findAll();

      expect(menuCategoryServiceMock.findAll).toHaveBeenCalledWith();

      expect(result).toEqual({
        message: 'Menu categories retrieved successfully',
        data: categories,
      });
    });

    it('should return empty array when no categories exist', async () => {
      menuCategoryServiceMock.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual({
        message: 'Menu categories retrieved successfully',
        data: [],
      });
    });
  });

  // ============================================================
  // FIND ONE
  // ============================================================

  describe('findOne', () => {
    it('should return one menu category', async () => {
      const category = {
        id: 'category-1',
        name: 'Dosa Specials',
        sortOrder: 2,
        isActive: true,
      };

      menuCategoryServiceMock.findOne.mockResolvedValue(category);

      const result = await controller.findOne('category-1');

      expect(menuCategoryServiceMock.findOne).toHaveBeenCalledWith(
        'category-1',
      );

      expect(result).toEqual({
        message: 'Menu category retrieved successfully',
        data: category,
      });
    });
  });

  // ============================================================
  // UPDATE
  // ============================================================

  describe('update', () => {
    it('should update menu category successfully', async () => {
      const updateDto = {
        name: 'Updated Dosa Specials',
        sortOrder: 3,
      };

      const updatedCategory = {
        id: 'category-1',
        name: 'Updated Dosa Specials',
        sortOrder: 3,
        isActive: true,
      };

      menuCategoryServiceMock.update.mockResolvedValue(updatedCategory);

      const result = await controller.update('category-1', updateDto);

      expect(menuCategoryServiceMock.update).toHaveBeenCalledWith(
        'category-1',
        updateDto,
      );

      expect(result).toEqual({
        message: 'Menu category updated successfully',
        data: updatedCategory,
      });
    });
  });

  // ============================================================
  // REMOVE
  // ============================================================

  describe('remove', () => {
    it('should remove menu category successfully', async () => {
      const removedCategory = {
        id: 'category-1',
        name: 'Dosa Specials',
        sortOrder: 2,
        isActive: false,
      };

      menuCategoryServiceMock.remove.mockResolvedValue(removedCategory);

      const result = await controller.remove('category-1');

      expect(menuCategoryServiceMock.remove).toHaveBeenCalledWith('category-1');

      expect(result).toEqual({
        message: 'Menu category removed successfully',
        data: removedCategory,
      });
    });
  });
});
