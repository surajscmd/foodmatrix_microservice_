import { ModifierController } from './modifier.controller';
import { ModifierService } from './modifier.service';
import { CreateModifierDto } from './dto/create-modifier.dto';
import { UpdateModifierDto } from './dto/update-modifier.dto';

describe('ModifierController', () => {
  let controller: ModifierController;

  const modifierServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    controller = new ModifierController(
      modifierServiceMock as unknown as ModifierService,
    );
  });

  // ============================================================
  // CREATE
  // ============================================================

  describe('create', () => {
    it('should create modifier successfully', async () => {
      const createDto: CreateModifierDto = {
        groupId: 'group-1',
        name: 'Extra Butter',
        sortOrder: 1,
        extraPrice: 20,
        isActive: true,
      };

      const serviceResult = {
        group: {
          id: 'group-1',
          name: 'Dosa Extras',
          sortOrder: 1,
          minSelections: 0,
          maxSelections: 4,
          isActive: true,
        },
        modifier: {
          id: 'modifier-1',
          groupId: 'group-1',
          name: 'Extra Butter',
          sortOrder: 1,
          extraPrice: 20,
          isActive: true,
        },
      };

      modifierServiceMock.create.mockResolvedValue(serviceResult);

      const result = await controller.create(createDto);

      expect(modifierServiceMock.create).toHaveBeenCalledWith(createDto);

      expect(result).toEqual({
        message: 'Modifier created successfully',
        result: serviceResult,
      });
    });
  });

  // ============================================================
  // FIND ALL
  // ============================================================

  describe('findAll', () => {
    it('should return all modifiers', async () => {
      const serviceResult = [
        {
          group: {
            id: 'group-1',
            name: 'Dosa Extras',
            sortOrder: 1,
            minSelections: 0,
            maxSelections: 4,
            isActive: true,
          },
          modifiers: [
            {
              id: 'modifier-1',
              groupId: 'group-1',
              name: 'Extra Butter',
              sortOrder: 1,
              extraPrice: 20,
              isActive: true,
            },
            {
              id: 'modifier-2',
              groupId: 'group-1',
              name: 'Cheese',
              sortOrder: 2,
              extraPrice: 40,
              isActive: true,
            },
          ],
        },
      ];

      modifierServiceMock.findAll.mockResolvedValue(serviceResult);

      const result = await controller.findAll();

      expect(modifierServiceMock.findAll).toHaveBeenCalledWith(undefined);

      expect(result).toEqual({
        message: 'Modifiers retrieved successfully',
        result: serviceResult,
      });
    });

    it('should return modifiers filtered by groupId', async () => {
      const serviceResult = [
        {
          group: {
            id: 'group-1',
            name: 'Dosa Extras',
            sortOrder: 1,
            minSelections: 0,
            maxSelections: 4,
            isActive: true,
          },
          modifiers: [
            {
              id: 'modifier-1',
              groupId: 'group-1',
              name: 'Extra Butter',
              sortOrder: 1,
              extraPrice: 20,
              isActive: true,
            },
          ],
        },
      ];

      modifierServiceMock.findAll.mockResolvedValue(serviceResult);

      const result = await controller.findAll('group-1');

      expect(modifierServiceMock.findAll).toHaveBeenCalledWith('group-1');

      expect(result).toEqual({
        message: 'Modifiers retrieved successfully',
        result: serviceResult,
      });
    });

    it('should return empty array when no modifiers exist', async () => {
      modifierServiceMock.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual({
        message: 'Modifiers retrieved successfully',
        result: [],
      });
    });
  });

  // ============================================================
  // FIND ONE
  // ============================================================

  describe('findOne', () => {
    it('should return one modifier', async () => {
      const serviceResult = {
        group: {
          id: 'group-1',
          name: 'Dosa Extras',
          sortOrder: 1,
          minSelections: 0,
          maxSelections: 4,
          isActive: true,
        },
        modifier: {
          id: 'modifier-1',
          groupId: 'group-1',
          name: 'Extra Butter',
          sortOrder: 1,
          extraPrice: 20,
          isActive: true,
        },
      };

      modifierServiceMock.findOne.mockResolvedValue(serviceResult);

      const result = await controller.findOne('modifier-1');

      expect(modifierServiceMock.findOne).toHaveBeenCalledWith('modifier-1');

      expect(result).toEqual({
        message: 'Modifier retrieved successfully',
        result: serviceResult,
      });
    });
  });

  // ============================================================
  // UPDATE
  // ============================================================

  describe('update', () => {
    it('should update modifier successfully', async () => {
      const updateDto: UpdateModifierDto = {
        name: 'Extra Butter Premium',
        extraPrice: 25,
      };

      const serviceResult = {
        group: {
          id: 'group-1',
          name: 'Dosa Extras',
          sortOrder: 1,
          minSelections: 0,
          maxSelections: 4,
          isActive: true,
        },
        modifier: {
          id: 'modifier-1',
          groupId: 'group-1',
          name: 'Extra Butter Premium',
          sortOrder: 1,
          extraPrice: 25,
          isActive: true,
        },
      };

      modifierServiceMock.update.mockResolvedValue(serviceResult);

      const result = await controller.update('modifier-1', updateDto);

      expect(modifierServiceMock.update).toHaveBeenCalledWith(
        'modifier-1',
        updateDto,
      );

      expect(result).toEqual({
        message: 'Modifier updated successfully',
        result: serviceResult,
      });
    });
  });

  // ============================================================
  // REMOVE
  // ============================================================

  describe('remove', () => {
    it('should remove modifier successfully', async () => {
      const serviceResult = {
        message: 'Modifier deleted successfully.',
      };

      modifierServiceMock.remove.mockResolvedValue(serviceResult);

      const result = await controller.remove('modifier-1');

      expect(modifierServiceMock.remove).toHaveBeenCalledWith('modifier-1');

      expect(result).toEqual({
        message: 'Modifier deleted successfully.',
      });
    });
  });
});
