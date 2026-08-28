import { BadRequestException, NotFoundException } from '@nestjs/common';

import type { ModifierGroup, Modifier } from '@prisma/client';

import { PrismaService } from '../../lib/prisma/prisma.service';
import { ModifierGroupService } from './modifier-group.service';
import { CreateModifierGroupDto } from './dto/create-modifier-group.dto';
import { UpdateModifierGroupDto } from './dto/update-modifier-group.dto';

type ModifierGroupWithModifiers = ModifierGroup & {
  modifiers: Modifier[];
};

type FindUniqueModifierGroup = PrismaService['modifierGroup']['findUnique'];

type FindManyModifierGroup = PrismaService['modifierGroup']['findMany'];

type CreateModifierGroup = PrismaService['modifierGroup']['create'];

type UpdateModifierGroup = PrismaService['modifierGroup']['update'];

describe('ModifierGroupService', () => {
  let service: ModifierGroupService;

  const modifierGroupFindUnique =
    jest.fn() as jest.MockedFunction<FindUniqueModifierGroup>;

  const modifierGroupFindMany =
    jest.fn() as jest.MockedFunction<FindManyModifierGroup>;

  const modifierGroupCreate =
    jest.fn() as jest.MockedFunction<CreateModifierGroup>;

  const modifierGroupUpdate =
    jest.fn() as jest.MockedFunction<UpdateModifierGroup>;

  const prismaMock = {
    modifierGroup: {
      findUnique: modifierGroupFindUnique,
      findMany: modifierGroupFindMany,
      create: modifierGroupCreate,
      update: modifierGroupUpdate,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new ModifierGroupService(prismaMock as unknown as PrismaService);
  });

  // ============================================================
  // CREATE
  // ============================================================

  describe('create', () => {
    const createDto: CreateModifierGroupDto = {
      name: 'Dosa Extras',
      sortOrder: 1,
      minSelections: 0,
      maxSelections: 4,
      isActive: true,
    };

    const createdGroup: ModifierGroup = {
      id: 'group-1',
      name: 'Dosa Extras',
      sortOrder: 1,
      minSelections: 0,
      maxSelections: 4,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create a modifier group successfully', async () => {
      modifierGroupCreate.mockResolvedValue(createdGroup);

      const result = await service.create(createDto);

      expect(modifierGroupCreate).toHaveBeenCalledWith({
        data: {
          name: 'Dosa Extras',
          sortOrder: 1,
          minSelections: 0,
          maxSelections: 4,
          isActive: true,
        },
      });

      expect(result).toEqual(createdGroup);
    });

    it('should create modifier group with provided values', async () => {
      const dto: CreateModifierGroupDto = {
        name: 'Spice Level',
        sortOrder: 2,
        minSelections: 1,
        maxSelections: 1,
        isActive: true,
      };

      const createdGroup: ModifierGroup = {
        id: 'group-2',
        name: 'Spice Level',
        sortOrder: 2,
        minSelections: 1,
        maxSelections: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      modifierGroupCreate.mockResolvedValue(createdGroup);

      const result = await service.create(dto);

      expect(modifierGroupCreate).toHaveBeenCalledWith({
        data: {
          name: 'Spice Level',
          sortOrder: 2,
          minSelections: 1,
          maxSelections: 1,
          isActive: true,
        },
      });

      expect(result).toEqual(createdGroup);
    });

    it('should throw BadRequestException when minSelections is greater than maxSelections', async () => {
      const dto: CreateModifierGroupDto = {
        name: 'Invalid Group',
        sortOrder: 1,
        minSelections: 5,
        maxSelections: 2,
        isActive: true,
      };

      await expect(service.create(dto)).rejects.toThrow(
        new BadRequestException(
          'minSelections cannot be greater than maxSelections',
        ),
      );

      expect(modifierGroupCreate).not.toHaveBeenCalled();
    });

    it('should allow minSelections equal to maxSelections', async () => {
      const dto: CreateModifierGroupDto = {
        name: 'Single Choice',
        sortOrder: 1,
        minSelections: 1,
        maxSelections: 1,
        isActive: true,
      };

      const resultGroup: ModifierGroup = {
        ...createdGroup,
        id: 'group-3',
        name: 'Single Choice',
        sortOrder: 1,
        minSelections: 1,
        maxSelections: 1,
      };

      modifierGroupCreate.mockResolvedValue(resultGroup);

      const result = await service.create(dto);

      expect(modifierGroupCreate).toHaveBeenCalled();

      expect(result).toEqual(resultGroup);
    });
  });

  // ============================================================
  // FIND ALL
  // ============================================================

  describe('findAll', () => {
    it('should return all active modifier groups ordered correctly', async () => {
      const groups: ModifierGroup[] = [
        {
          id: 'group-1',
          name: 'Dosa Extras',
          sortOrder: 1,
          minSelections: 0,
          maxSelections: 4,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'group-2',
          name: 'Spice Level',
          sortOrder: 2,
          minSelections: 1,
          maxSelections: 1,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      modifierGroupFindMany.mockResolvedValue(groups);

      const result = await service.findAll();

      expect(modifierGroupFindMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
        },
        orderBy: [
          {
            sortOrder: 'asc',
          },
          {
            name: 'asc',
          },
        ],
      });

      expect(result).toEqual(groups);
    });

    it('should return an empty array when no active groups exist', async () => {
      modifierGroupFindMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  // ============================================================
  // FIND ONE
  // ============================================================

  describe('findOne', () => {
    const modifier: Modifier = {
      id: 'modifier-1',
      groupId: 'group-1',
      name: 'Extra Butter',
      sortOrder: 1,
      extraPrice: 20 as never,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const group: ModifierGroupWithModifiers = {
      id: 'group-1',
      name: 'Dosa Extras',
      sortOrder: 1,
      minSelections: 0,
      maxSelections: 4,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      modifiers: [modifier],
    };

    it('should return modifier group with modifiers', async () => {
      modifierGroupFindUnique.mockResolvedValue(group);

      const result = await service.findOne('group-1');

      expect(modifierGroupFindUnique).toHaveBeenCalledWith({
        where: {
          id: 'group-1',
        },
        include: {
          modifiers: true,
        },
      });

      expect(result).toEqual(group);
    });

    it('should throw NotFoundException when modifier group does not exist', async () => {
      modifierGroupFindUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        new NotFoundException('Modifier group not found'),
      );
    });
  });

  // ============================================================
  // UPDATE
  // ============================================================

  describe('update', () => {
    const existingGroup: ModifierGroupWithModifiers = {
      id: 'group-1',
      name: 'Dosa Extras',
      sortOrder: 1,
      minSelections: 0,
      maxSelections: 4,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      modifiers: [],
    };

    it('should update modifier group successfully', async () => {
      const updateDto: UpdateModifierGroupDto = {
        name: 'Dosa Add-ons',
        sortOrder: 2,
        minSelections: 0,
        maxSelections: 3,
      };

      const updatedGroup: ModifierGroup = {
        ...existingGroup,
        name: 'Dosa Add-ons',
        sortOrder: 2,
        minSelections: 0,
        maxSelections: 3,
      };

      modifierGroupFindUnique.mockResolvedValue(existingGroup);
      modifierGroupUpdate.mockResolvedValue(updatedGroup);

      const result = await service.update('group-1', updateDto);

      expect(modifierGroupFindUnique).toHaveBeenCalledWith({
        where: {
          id: 'group-1',
        },
        include: {
          modifiers: true,
        },
      });

      expect(modifierGroupUpdate).toHaveBeenCalledWith({
        where: {
          id: 'group-1',
        },
        data: {
          name: 'Dosa Add-ons',
          sortOrder: 2,
          minSelections: 0,
          maxSelections: 3,
        },
      });

      expect(result).toEqual(updatedGroup);
    });

    it('should keep existing selections when only other fields are updated', async () => {
      const updateDto: UpdateModifierGroupDto = {
        name: 'Updated Dosa Extras',
      };

      const updatedGroup: ModifierGroup = {
        ...existingGroup,
        name: 'Updated Dosa Extras',
      };

      modifierGroupFindUnique.mockResolvedValue(existingGroup);
      modifierGroupUpdate.mockResolvedValue(updatedGroup);

      const result = await service.update('group-1', updateDto);

      expect(modifierGroupUpdate).toHaveBeenCalledWith({
        where: {
          id: 'group-1',
        },
        data: {
          name: 'Updated Dosa Extras',
        },
      });

      expect(result).toEqual(updatedGroup);
    });

    it('should throw NotFoundException when modifier group does not exist', async () => {
      modifierGroupFindUnique.mockResolvedValue(null);

      await expect(
        service.update('invalid-id', {
          name: 'Updated Group',
        }),
      ).rejects.toThrow(new NotFoundException('Modifier group not found'));

      expect(modifierGroupUpdate).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when modifier group is inactive', async () => {
      const inactiveGroup: ModifierGroupWithModifiers = {
        ...existingGroup,
        isActive: false,
      };

      modifierGroupFindUnique.mockResolvedValue(inactiveGroup);

      await expect(
        service.update('group-1', {
          name: 'Updated Group',
        }),
      ).rejects.toThrow(
        new BadRequestException('Cannot update an inactive modifier group'),
      );

      expect(modifierGroupUpdate).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when updated minSelections exceeds maxSelections', async () => {
      modifierGroupFindUnique.mockResolvedValue(existingGroup);

      const updateDto: UpdateModifierGroupDto = {
        minSelections: 5,
      };

      await expect(service.update('group-1', updateDto)).rejects.toThrow(
        new BadRequestException(
          'minSelections cannot be greater than maxSelections',
        ),
      );

      expect(modifierGroupUpdate).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when updated maxSelections becomes smaller than existing minSelections', async () => {
      modifierGroupFindUnique.mockResolvedValue(existingGroup);

      const updateDto: UpdateModifierGroupDto = {
        maxSelections: -1,
      };

      await expect(service.update('group-1', updateDto)).rejects.toThrow(
        new BadRequestException(
          'minSelections cannot be greater than maxSelections',
        ),
      );

      expect(modifierGroupUpdate).not.toHaveBeenCalled();
    });

    it('should validate minSelections and maxSelections together', async () => {
      const updateDto: UpdateModifierGroupDto = {
        minSelections: 2,
        maxSelections: 4,
      };

      const updatedGroup: ModifierGroup = {
        ...existingGroup,
        minSelections: 2,
        maxSelections: 4,
      };

      modifierGroupFindUnique.mockResolvedValue(existingGroup);
      modifierGroupUpdate.mockResolvedValue(updatedGroup);

      const result = await service.update('group-1', updateDto);

      expect(modifierGroupUpdate).toHaveBeenCalledWith({
        where: {
          id: 'group-1',
        },
        data: {
          minSelections: 2,
          maxSelections: 4,
        },
      });

      expect(result).toEqual(updatedGroup);
    });
  });

  // ============================================================
  // REMOVE
  // ============================================================

  describe('remove', () => {
    const activeGroup: ModifierGroupWithModifiers = {
      id: 'group-1',
      name: 'Dosa Extras',
      sortOrder: 1,
      minSelections: 0,
      maxSelections: 4,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      modifiers: [],
    };

    it('should soft delete modifier group successfully', async () => {
      modifierGroupFindUnique.mockResolvedValue(activeGroup);

      const deactivatedGroup: ModifierGroup = {
        ...activeGroup,
        isActive: false,
      };

      modifierGroupUpdate.mockResolvedValue(deactivatedGroup);

      const result = await service.remove('group-1');

      expect(modifierGroupFindUnique).toHaveBeenCalledWith({
        where: {
          id: 'group-1',
        },
        include: {
          modifiers: true,
        },
      });

      expect(modifierGroupUpdate).toHaveBeenCalledWith({
        where: {
          id: 'group-1',
        },
        data: {
          isActive: false,
        },
      });

      expect(result).toEqual({
        message: 'Modifier group deleted successfully.',
      });
    });

    it('should throw NotFoundException when removing non-existing group', async () => {
      modifierGroupFindUnique.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(
        new NotFoundException('Modifier group not found'),
      );

      expect(modifierGroupUpdate).not.toHaveBeenCalled();
    });
  });
});
