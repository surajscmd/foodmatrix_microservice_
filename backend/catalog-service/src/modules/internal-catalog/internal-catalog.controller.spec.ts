import { InternalCatalogController } from './internal-catalog.controller';
import { InternalCatalogService } from './internal-catalog.service';

describe('InternalCatalogController', () => {
  let controller: InternalCatalogController;

  const internalCatalogServiceMock = {
    getBulkPricing: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    controller = new InternalCatalogController(
      internalCatalogServiceMock as unknown as InternalCatalogService,
    );
  });

  describe('getBulkPricing', () => {
    it('should call service with restaurantId, menuItemIds and modifierIds', async () => {
      const dto = {
        restaurantId: 'restaurant-1',
        menuItemIds: ['menu-item-1', 'menu-item-2'],
        modifierIds: ['modifier-1', 'modifier-2'],
      };

      const serviceResult = {
        menuItems: [
          {
            menuItemId: 'menu-item-1',
            name: 'Masala Dosa',
            sku: 'DOS-MAS-001',
            price: 139,
            isAvailable: true,
          },
        ],
        modifiers: [
          {
            id: 'modifier-1',
            name: 'Extra Butter',
            extraPrice: 20,
            isActive: true,
          },
        ],
      };

      internalCatalogServiceMock.getBulkPricing.mockResolvedValue(
        serviceResult,
      );

      const result = await controller.getBulkPricing(dto);

      expect(internalCatalogServiceMock.getBulkPricing).toHaveBeenCalledWith(
        'restaurant-1',
        ['menu-item-1', 'menu-item-2'],
        ['modifier-1', 'modifier-2'],
      );

      expect(result).toEqual(serviceResult);
    });

    it('should return the service response', async () => {
      const dto = {
        restaurantId: 'restaurant-1',
        menuItemIds: ['menu-item-1'],
        modifierIds: [],
      };

      const serviceResult = {
        menuItems: [
          {
            menuItemId: 'menu-item-1',
            name: 'Plain Dosa',
            sku: 'DOS-PLA-001',
            price: 99,
            isAvailable: true,
          },
        ],
        modifiers: [],
      };

      internalCatalogServiceMock.getBulkPricing.mockResolvedValue(
        serviceResult,
      );

      const result = await controller.getBulkPricing(dto);

      expect(result).toEqual(serviceResult);
    });

    it('should work when menuItemIds and modifierIds are empty', async () => {
      const dto = {
        restaurantId: 'restaurant-1',
        menuItemIds: [],
        modifierIds: [],
      };

      const serviceResult = {
        menuItems: [],
        modifiers: [],
      };

      internalCatalogServiceMock.getBulkPricing.mockResolvedValue(
        serviceResult,
      );

      const result = await controller.getBulkPricing(dto);

      expect(internalCatalogServiceMock.getBulkPricing).toHaveBeenCalledWith(
        'restaurant-1',
        [],
        [],
      );

      expect(result).toEqual(serviceResult);
    });

    it('should propagate service errors', async () => {
      const dto = {
        restaurantId: 'restaurant-1',
        menuItemIds: ['menu-item-1'],
        modifierIds: ['modifier-1'],
      };

      const error = new Error('Catalog service error');

      internalCatalogServiceMock.getBulkPricing.mockRejectedValue(error);

      await expect(controller.getBulkPricing(dto)).rejects.toThrow(
        'Catalog service error',
      );
    });
  });
});
