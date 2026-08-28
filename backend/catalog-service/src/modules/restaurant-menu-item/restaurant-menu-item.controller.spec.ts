import { RestaurantMenuItemController } from './restaurant-menu-item.controller';
import { RestaurantMenuItemService } from './restaurant-menu-item.service';

import { CreateRestaurantMenuItemDto } from './dto/create-restaurant-menu-item.dto';
import { UpdateRestaurantMenuItemDto } from './dto/update-restaurant-menu-item.dto';

describe('RestaurantMenuItemController', () => {
  let controller: RestaurantMenuItemController;

  const restaurantMenuItemServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findChangedItems: jest.fn(),
    findAllChangedItems: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    controller = new RestaurantMenuItemController(
      restaurantMenuItemServiceMock as unknown as RestaurantMenuItemService,
    );
  });

  // ============================================================
  // CREATE
  // POST /restaurant-menu-item
  // ============================================================

  describe('create', () => {
    it('should create restaurant menu item successfully', async () => {
      const dto: CreateRestaurantMenuItemDto = {
        restaurantId: 'restaurant-1',
        menuItemId: 'menu-item-1',
        price: 429,
        isAvailable: true,
      };

      const serviceResult = {
        id: 'restaurant-menu-item-1',
        restaurantId: 'restaurant-1',
        menuItemId: 'menu-item-1',
        price: 429,
        isAvailable: true,
      };

      restaurantMenuItemServiceMock.create.mockResolvedValue(serviceResult);

      const result = await controller.create(dto);

      expect(restaurantMenuItemServiceMock.create).toHaveBeenCalledWith(dto);

      expect(result).toEqual({
        message: 'Restaurant menu item created successfully',
        data: serviceResult,
      });
    });
  });

  // ============================================================
  // FIND ALL
  // GET /restaurant-menu-item/restaurant/:restaurantId
  // ============================================================

  describe('findAll', () => {
    it('should return paginated menu items for a restaurant', async () => {
      const serviceResult = {
        data: [
          {
            id: 'menu-item-1',
            name: 'Idli',
            sku: 'SID-IDL-001',
            price: 79,
            isAvailable: true,
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 25,
          totalPages: 3,
        },
      };

      restaurantMenuItemServiceMock.findAll.mockResolvedValue(serviceResult);

      const result = await controller.findAll('restaurant-1', '1', '10');

      expect(restaurantMenuItemServiceMock.findAll).toHaveBeenCalledWith(
        'restaurant-1',
        1,
        10,
      );

      expect(result).toEqual({
        message: 'Restaurant menu items retrieved successfully',
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

      restaurantMenuItemServiceMock.findAll.mockResolvedValue(serviceResult);

      const result = await controller.findAll('restaurant-1');

      expect(restaurantMenuItemServiceMock.findAll).toHaveBeenCalledWith(
        'restaurant-1',
        1,
        10,
      );

      expect(result).toEqual({
        message: 'Restaurant menu items retrieved successfully',
        data: [],
        pagination: serviceResult.pagination,
      });
    });

    it('should convert page and limit from string to number', async () => {
      restaurantMenuItemServiceMock.findAll.mockResolvedValue({
        data: [],
        pagination: {
          page: 2,
          limit: 5,
          total: 0,
          totalPages: 0,
        },
      });

      await controller.findAll('restaurant-1', '2', '5');

      expect(restaurantMenuItemServiceMock.findAll).toHaveBeenCalledWith(
        'restaurant-1',
        2,
        5,
      );
    });
  });

  // ============================================================
  // FIND CHANGED ITEMS FOR ONE RESTAURANT
  // GET /restaurant-menu-item/restaurant/:restaurantId/changed
  // ============================================================

  describe('findChangedItems', () => {
    it('should return changed menu items for one restaurant', async () => {
      const serviceResult = {
        data: [
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
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      restaurantMenuItemServiceMock.findChangedItems.mockResolvedValue(
        serviceResult,
      );

      const result = await controller.findChangedItems(
        'restaurant-1',
        '1',
        '10',
      );

      expect(
        restaurantMenuItemServiceMock.findChangedItems,
      ).toHaveBeenCalledWith('restaurant-1', 1, 10);

      expect(result).toEqual({
        message: 'Changed restaurant menu items retrieved successfully',
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

      restaurantMenuItemServiceMock.findChangedItems.mockResolvedValue(
        serviceResult,
      );

      const result = await controller.findChangedItems('restaurant-1');

      expect(
        restaurantMenuItemServiceMock.findChangedItems,
      ).toHaveBeenCalledWith('restaurant-1', 1, 10);

      expect(result).toEqual({
        message: 'Changed restaurant menu items retrieved successfully',
        data: [],
        pagination: serviceResult.pagination,
      });
    });
  });

  // ============================================================
  // FIND CHANGED ITEMS ACROSS ALL RESTAURANTS
  // GET /restaurant-menu-item/changed
  // ============================================================

  describe('findAllChangedItems', () => {
    it('should return changed items across all restaurants', async () => {
      const serviceResult = {
        data: [
          {
            restaurantId: 'restaurant-1',
            menuItems: [
              {
                id: 'restaurant-menu-item-1',
                restaurantPrice: 429,
                defaultPrice: 399,
              },
            ],
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          totalChangedItems: 1,
          totalPages: 1,
        },
      };

      restaurantMenuItemServiceMock.findAllChangedItems.mockResolvedValue(
        serviceResult,
      );

      const result = await controller.findAllChangedItems('1', '10');

      expect(
        restaurantMenuItemServiceMock.findAllChangedItems,
      ).toHaveBeenCalledWith(1, 10);

      expect(result).toEqual({
        message: 'Changed restaurant menu items retrieved successfully',
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
          totalChangedItems: 0,
          totalPages: 0,
        },
      };

      restaurantMenuItemServiceMock.findAllChangedItems.mockResolvedValue(
        serviceResult,
      );

      const result = await controller.findAllChangedItems();

      expect(
        restaurantMenuItemServiceMock.findAllChangedItems,
      ).toHaveBeenCalledWith(1, 10);

      expect(result).toEqual({
        message: 'Changed restaurant menu items retrieved successfully',
        data: [],
        pagination: serviceResult.pagination,
      });
    });
  });

  // ============================================================
  // FIND ONE
  // GET /restaurant-menu-item/:id
  // ============================================================

  describe('findOne', () => {
    it('should return one restaurant menu item', async () => {
      const serviceResult = {
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
      };

      restaurantMenuItemServiceMock.findOne.mockResolvedValue(serviceResult);

      const result = await controller.findOne('restaurant-menu-item-1');

      expect(restaurantMenuItemServiceMock.findOne).toHaveBeenCalledWith(
        'restaurant-menu-item-1',
      );

      expect(result).toEqual({
        message: 'Restaurant menu item retrieved successfully',
        data: serviceResult,
      });
    });
  });

  // ============================================================
  // UPDATE
  // PATCH /restaurant-menu-item/:id
  // ============================================================

  describe('update', () => {
    it('should update restaurant menu item successfully', async () => {
      const dto: UpdateRestaurantMenuItemDto = {
        price: 459,
      };

      const serviceResult = {
        id: 'restaurant-menu-item-1',
        restaurantId: 'restaurant-1',
        menuItemId: 'menu-item-1',
        price: 459,
        isAvailable: true,
      };

      restaurantMenuItemServiceMock.update.mockResolvedValue(serviceResult);

      const result = await controller.update('restaurant-menu-item-1', dto);

      expect(restaurantMenuItemServiceMock.update).toHaveBeenCalledWith(
        'restaurant-menu-item-1',
        dto,
      );

      expect(result).toEqual({
        message: 'Restaurant menu item updated successfully',
        data: serviceResult,
      });
    });

    it('should update only isAvailable', async () => {
      const dto: UpdateRestaurantMenuItemDto = {
        isAvailable: false,
      };

      const serviceResult = {
        id: 'restaurant-menu-item-1',
        restaurantId: 'restaurant-1',
        menuItemId: 'menu-item-1',
        price: 429,
        isAvailable: false,
      };

      restaurantMenuItemServiceMock.update.mockResolvedValue(serviceResult);

      const result = await controller.update('restaurant-menu-item-1', dto);

      expect(restaurantMenuItemServiceMock.update).toHaveBeenCalledWith(
        'restaurant-menu-item-1',
        dto,
      );

      expect(result).toEqual({
        message: 'Restaurant menu item updated successfully',
        data: serviceResult,
      });
    });
  });

  // ============================================================
  // REMOVE
  // DELETE /restaurant-menu-item/:id
  // ============================================================

  describe('remove', () => {
    it('should remove restaurant menu item successfully', async () => {
      const serviceResult = {
        message: 'Restaurant menu item deleted successfully.',
      };

      restaurantMenuItemServiceMock.remove.mockResolvedValue(serviceResult);

      const result = await controller.remove('restaurant-menu-item-1');

      expect(restaurantMenuItemServiceMock.remove).toHaveBeenCalledWith(
        'restaurant-menu-item-1',
      );

      expect(result).toEqual({
        message: 'Restaurant menu item deleted successfully',
        data: serviceResult,
      });
    });
  });
});
