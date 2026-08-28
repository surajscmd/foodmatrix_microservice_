import { ItemModifierGroupController } from './item-modifier-group.controller';
import { ItemModifierGroupService } from './item-modifier-group.service';

describe('ItemModifierGroupController', () => {
  let controller: ItemModifierGroupController;

  const serviceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    controller = new ItemModifierGroupController(
      serviceMock as unknown as ItemModifierGroupService,
    );
  });

  // ============================================================
  // CREATE
  // ============================================================

  describe('create', () => {
    it('should assign modifier group to menu item successfully', async () => {
      const createDto = {
        menuItemId: 'menu-item-1',
        groupId: 'group-1',
      };

      const serviceResult = {
        id: 'relation-1',
        menuItemId: 'menu-item-1',
        groupId: 'group-1',
      };

      serviceMock.create.mockResolvedValue(serviceResult);

      const result = await controller.create(createDto);

      expect(serviceMock.create).toHaveBeenCalledWith(createDto);

      expect(result).toEqual({
        message: 'Modifier group assigned to menu item successfully',
        result: serviceResult,
      });
    });
  });

  // ============================================================
  // FIND ALL
  // ============================================================

  describe('findAll', () => {
    it('should return all item modifier groups', async () => {
      const serviceResult = [
        {
          id: 'relation-1',
          menuItemId: 'menu-item-1',
          groupId: 'group-1',
        },
        {
          id: 'relation-2',
          menuItemId: 'menu-item-2',
          groupId: 'group-2',
        },
      ];

      serviceMock.findAll.mockResolvedValue(serviceResult);

      const result = await controller.findAll();

      expect(serviceMock.findAll).toHaveBeenCalledWith(undefined);

      expect(result).toEqual({
        message: 'Item modifier groups retrieved successfully',
        result: serviceResult,
      });
    });

    it('should return modifier groups for a specific menu item', async () => {
      const serviceResult = [
        {
          id: 'relation-1',
          menuItemId: 'menu-item-1',
          groupId: 'group-1',
        },
      ];

      serviceMock.findAll.mockResolvedValue(serviceResult);

      const result = await controller.findAll('menu-item-1');

      expect(serviceMock.findAll).toHaveBeenCalledWith('menu-item-1');

      expect(result).toEqual({
        message: 'Item modifier groups retrieved successfully',
        result: serviceResult,
      });
    });
  });

  // ============================================================
  // FIND ONE
  // ============================================================

  describe('findOne', () => {
    it('should return one item modifier group', async () => {
      const serviceResult = {
        id: 'relation-1',
        menuItemId: 'menu-item-1',
        groupId: 'group-1',
      };

      serviceMock.findOne.mockResolvedValue(serviceResult);

      const result = await controller.findOne('menu-item-1', 'group-1');

      expect(serviceMock.findOne).toHaveBeenCalledWith(
        'menu-item-1',
        'group-1',
      );

      expect(result).toEqual({
        message: 'Item modifier group retrieved successfully',
        result: serviceResult,
      });
    });
  });

  // ============================================================
  // REMOVE
  // ============================================================

  describe('remove', () => {
    it('should remove item modifier group successfully', async () => {
      const serviceResult = {
        message: 'Modifier group removed from menu item successfully.',
      };

      serviceMock.remove.mockResolvedValue(serviceResult);

      const result = await controller.remove('menu-item-1', 'group-1');

      expect(serviceMock.remove).toHaveBeenCalledWith('menu-item-1', 'group-1');

      expect(result).toEqual(serviceResult);
    });
  });
});
