import { ModifierGroupController } from './modifier-group.controller';
import { ModifierGroupService } from './modifier-group.service';
import { CreateModifierGroupDto } from './dto/create-modifier-group.dto';
import { UpdateModifierGroupDto } from './dto/update-modifier-group.dto';

describe('ModifierGroupController', () => {
  let controller: ModifierGroupController;

  const modifierGroupServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    controller = new ModifierGroupController(
      modifierGroupServiceMock as unknown as ModifierGroupService,
    );
  });

  // ============================================================
  // CREATE
  // ============================================================

  describe('create', () => {
    it('should create modifier group successfully', async () => {
      const createDto: CreateModifierGroupDto = {
        name: 'Dosa Extras',
        sortOrder: 1,
        minSelections: 0,
        maxSelections: 4,
        isActive: true,
      };

      const serviceResult = {
        id: 'group-1',
        name: 'Dosa Extras',
        sortOrder: 1,
        minSelections: 0,
        maxSelections: 4,
        isActive: true,
      };

      modifierGroupServiceMock.create.mockResolvedValue(serviceResult);

      const result = await controller.create(createDto);

      expect(modifierGroupServiceMock.create).toHaveBeenCalledWith(createDto);

      expect(result).toEqual(serviceResult);
    });
  });

  // ============================================================
  // FIND ALL
  // ============================================================

  describe('findAll', () => {
    it('should return all modifier groups', async () => {
      const serviceResult = [
        {
          id: 'group-1',
          name: 'Dosa Extras',
          sortOrder: 1,
          minSelections: 0,
          maxSelections: 4,
          isActive: true,
        },
        {
          id: 'group-2',
          name: 'Spice Level',
          sortOrder: 2,
          minSelections: 1,
          maxSelections: 1,
          isActive: true,
        },
      ];

      modifierGroupServiceMock.findAll.mockResolvedValue(serviceResult);

      const result = await controller.findAll();

      expect(modifierGroupServiceMock.findAll).toHaveBeenCalledWith();

      expect(result).toEqual(serviceResult);
    });

    it('should return empty array when no modifier groups exist', async () => {
      modifierGroupServiceMock.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
    });
  });

  // ============================================================
  // FIND ONE
  // ============================================================

  describe('findOne', () => {
    it('should return one modifier group', async () => {
      const serviceResult = {
        id: 'group-1',
        name: 'Dosa Extras',
        sortOrder: 1,
        minSelections: 0,
        maxSelections: 4,
        isActive: true,
        modifiers: [],
      };

      modifierGroupServiceMock.findOne.mockResolvedValue(serviceResult);

      const result = await controller.findOne('group-1');

      expect(modifierGroupServiceMock.findOne).toHaveBeenCalledWith('group-1');

      expect(result).toEqual(serviceResult);
    });
  });

  // ============================================================
  // UPDATE
  // ============================================================

  describe('update', () => {
    it('should update modifier group successfully', async () => {
      const updateDto: UpdateModifierGroupDto = {
        name: 'Updated Dosa Extras',
        sortOrder: 2,
        minSelections: 0,
        maxSelections: 3,
      };

      const serviceResult = {
        id: 'group-1',
        name: 'Updated Dosa Extras',
        sortOrder: 2,
        minSelections: 0,
        maxSelections: 3,
        isActive: true,
      };

      modifierGroupServiceMock.update.mockResolvedValue(serviceResult);

      const result = await controller.update('group-1', updateDto);

      expect(modifierGroupServiceMock.update).toHaveBeenCalledWith(
        'group-1',
        updateDto,
      );

      expect(result).toEqual(serviceResult);
    });
  });

  // ============================================================
  // REMOVE
  // ============================================================

  describe('remove', () => {
    it('should remove modifier group successfully', async () => {
      const serviceResult = {
        message: 'Modifier group deleted successfully.',
      };

      modifierGroupServiceMock.remove.mockResolvedValue(serviceResult);

      const result = await controller.remove('group-1');

      expect(modifierGroupServiceMock.remove).toHaveBeenCalledWith('group-1');

      expect(result).toEqual(serviceResult);
    });
  });
});
