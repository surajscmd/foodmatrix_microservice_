import type { CatalogActor } from '../../auth/catalog-access';
import { MenuItemController } from './menu-item.controller';
import { MenuItemService } from './menu-item.service';

describe('MenuItemController', () => {
  const actor: CatalogActor = {
    id: 'admin',
    role: 'SUPER_ADMIN',
    managedRestaurantId: null,
    restaurants: [{ id: 'restaurant-1' }],
  };
  let controller: MenuItemController;

  const menuItemServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByCategory: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    controller = new MenuItemController(
      menuItemServiceMock as unknown as MenuItemService,
    );
  });

  // ============================================================
  // CREATE
  // ============================================================

  describe('create', () => {
    it('should create menu item successfully', async () => {
      const createDto = {
        categoryId: 'category-1',
        name: 'Masala Dosa',
        sku: 'DOS-MAS-001',
        description: 'Crispy dosa with potato masala',
        basePrice: 139,
        isAvailable: true,
      };

      const serviceResult = {
        id: 'menu-item-1',
        ...createDto,
      };

      menuItemServiceMock.create.mockResolvedValue(serviceResult);

      const result = await controller.create(createDto);

      expect(menuItemServiceMock.create).toHaveBeenCalledWith(createDto);

      expect(result).toEqual({
        message: 'Menu item created successfully',
        data: serviceResult,
      });
    });
  });

  // ============================================================
  // FIND ALL
  // ============================================================

  describe('findAll', () => {
    it('should return paginated menu items', async () => {
      const serviceResult = {
        data: [
          {
            id: 'menu-item-1',
            name: 'Masala Dosa',
            sku: 'DOS-MAS-001',
            basePrice: 139,
          },
          {
            id: 'menu-item-2',
            name: 'Plain Dosa',
            sku: 'DOS-PLA-001',
            basePrice: 99,
          },
        ],
        pagination: {
          page: 2,
          limit: 10,
          total: 25,
          totalPages: 3,
        },
      };

      menuItemServiceMock.findAll.mockResolvedValue(serviceResult);

      const result = await controller.findAll(actor, '2', '10');

      expect(menuItemServiceMock.findAll).toHaveBeenCalledWith(
        2,
        10,
        undefined,
      );

      expect(result).toEqual({
        message: 'Menu items retrieved successfully',
        ...serviceResult,
      });
    });

    it('should use default page and limit', async () => {
      const serviceResult = {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      };

      menuItemServiceMock.findAll.mockResolvedValue(serviceResult);

      const result = await controller.findAll(actor);

      expect(menuItemServiceMock.findAll).toHaveBeenCalledWith(
        1,
        10,
        undefined,
      );

      expect(result).toEqual({
        message: 'Menu items retrieved successfully',
        ...serviceResult,
      });
    });
  });

  // ============================================================
  // FIND ONE
  // ============================================================

  describe('findOne', () => {
    it('should return one menu item', async () => {
      const serviceResult = {
        id: 'menu-item-1',
        name: 'Masala Dosa',
        sku: 'DOS-MAS-001',
        basePrice: 139,
      };

      menuItemServiceMock.findOne.mockResolvedValue(serviceResult);

      const result = await controller.findOne('menu-item-1');

      expect(menuItemServiceMock.findOne).toHaveBeenCalledWith('menu-item-1');

      expect(result).toEqual({
        message: 'Menu item fetched successfully',
        data: serviceResult,
      });
    });
  });

  // ============================================================
  // FIND BY CATEGORY
  // ============================================================

  describe('findByCategory', () => {
    it('should return menu items for a category', async () => {
      const serviceResult = {
        category: {
          id: 'category-1',
          name: 'Dosa Specials',
          sortOrder: 2,
          isActive: true,
        },
        data: [
          {
            id: 'menu-item-1',
            name: 'Masala Dosa',
            sku: 'DOS-MAS-001',
            basePrice: 139,
          },
          {
            id: 'menu-item-2',
            name: 'Plain Dosa',
            sku: 'DOS-PLA-001',
            basePrice: 99,
          },
        ],
      };

      menuItemServiceMock.findByCategory.mockResolvedValue(serviceResult);

      const result = await controller.findByCategory(actor, 'category-1');

      expect(menuItemServiceMock.findByCategory).toHaveBeenCalledWith(
        'category-1',
        undefined,
      );

      expect(result).toEqual({
        message: 'Menu items by category retrieved successfully',
        ...serviceResult,
      });
    });
  });

  // ============================================================
  // UPDATE
  // ============================================================

  describe('update', () => {
    it('should update menu item successfully', async () => {
      const updateDto = {
        name: 'Updated Masala Dosa',
        basePrice: 149,
      };

      const serviceResult = {
        id: 'menu-item-1',
        categoryId: 'category-1',
        name: 'Updated Masala Dosa',
        sku: 'DOS-MAS-001',
        basePrice: 149,
        isAvailable: true,
      };

      menuItemServiceMock.update.mockResolvedValue(serviceResult);

      const result = await controller.update('menu-item-1', updateDto);

      expect(menuItemServiceMock.update).toHaveBeenCalledWith(
        'menu-item-1',
        updateDto,
      );

      expect(result).toEqual({
        message: 'Menu item updated successfully',
        data: serviceResult,
      });
    });
  });

  // ============================================================
  // REMOVE
  // ============================================================

  describe('remove', () => {
    it('should deactivate menu item successfully', async () => {
      const serviceResult = {
        id: 'menu-item-1',
        name: 'Masala Dosa',
        isAvailable: false,
      };

      menuItemServiceMock.remove.mockResolvedValue(serviceResult);

      const result = await controller.remove('menu-item-1');

      expect(menuItemServiceMock.remove).toHaveBeenCalledWith('menu-item-1');

      expect(result).toEqual({
        message: 'Menu item deactivated successfully',
        data: serviceResult,
      });
    });
  });
});
