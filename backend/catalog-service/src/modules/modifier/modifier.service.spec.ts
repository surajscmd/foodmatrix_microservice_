import { BadRequestException, NotFoundException } from '@nestjs/common';

import { Prisma, type Modifier, type ModifierGroup } from '@prisma/client';

import { PrismaService } from '../../lib/prisma/prisma.service';
import { ModifierService } from './modifier.service';
import { CreateModifierDto } from './dto/create-modifier.dto';
import { UpdateModifierDto } from './dto/update-modifier.dto';

type ModifierWithGroup = Modifier & {
  group: ModifierGroup;
};

type ModifierGroupFindUnique = PrismaService['modifierGroup']['findUnique'];

type ModifierCreate = PrismaService['modifier']['create'];

type ModifierFindMany = PrismaService['modifier']['findMany'];

type ModifierFindUnique = PrismaService['modifier']['findUnique'];

type ModifierUpdate = PrismaService['modifier']['update'];

describe('ModifierService', () => {
  let service: ModifierService;

  const modifierGroupFindUnique =
    jest.fn() as jest.MockedFunction<ModifierGroupFindUnique>;

  const modifierCreate = jest.fn() as jest.MockedFunction<ModifierCreate>;

  const modifierFindMany = jest.fn() as jest.MockedFunction<ModifierFindMany>;

  const modifierFindUnique =
    jest.fn() as jest.MockedFunction<ModifierFindUnique>;

  const modifierUpdate = jest.fn() as jest.MockedFunction<ModifierUpdate>;

  const prismaMock = {
    modifierGroup: {
      findUnique: modifierGroupFindUnique,
    },
    modifier: {
      create: modifierCreate,
      findMany: modifierFindMany,
      findUnique: modifierFindUnique,
      update: modifierUpdate,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new ModifierService(prismaMock as unknown as PrismaService);
  });

  // ============================================================
  // CREATE
  // ============================================================

  describe('create', () => {
    const group: ModifierGroup = {
      id: 'group-1',
      name: 'Dosa Extras',
      sortOrder: 1,
      minSelections: 0,
      maxSelections: 4,
      isActive: true,
      createdAt: new Date('2026-08-27T11:16:03.561Z'),
      updatedAt: new Date('2026-08-27T11:48:37.073Z'),
    };

    const modifier: Modifier = {
      id: 'modifier-1',
      groupId: 'group-1',
      name: 'Extra Butter',
      sortOrder: 1,
      extraPrice: new Prisma.Decimal('20.00'),
      isActive: true,
      createdAt: new Date('2026-08-28T16:30:32.959Z'),
      updatedAt: new Date('2026-08-28T16:30:32.959Z'),
    };

    it('should create modifier successfully', async () => {
      const createDto: CreateModifierDto = {
        groupId: 'group-1',
        name: 'Extra Butter',
        sortOrder: 1,
        extraPrice: 20,
        isActive: true,
      };

      modifierGroupFindUnique.mockResolvedValue(group);
      modifierCreate.mockResolvedValue(modifier);

      const result = await service.create(createDto);

      expect(modifierGroupFindUnique).toHaveBeenCalledWith({
        where: {
          id: 'group-1',
        },
      });

      expect(modifierCreate).toHaveBeenCalledWith({
        data: {
          groupId: 'group-1',
          name: 'Extra Butter',
          sortOrder: 1,
          extraPrice: 20,
          isActive: true,
        },
      });

      expect(result).toEqual({
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
          createdAt: modifier.createdAt,
          updatedAt: modifier.updatedAt,
        },
      });
    });

    it('should create modifier with zero/default values', async () => {
      const createDto: CreateModifierDto = {
        groupId: 'group-1',
        name: 'Extra Masala',
        sortOrder: 0,
        extraPrice: 0,
        isActive: true,
      };

      const createdModifier: Modifier = {
        ...modifier,
        id: 'modifier-2',
        name: 'Extra Masala',
        sortOrder: 0,
        extraPrice: new Prisma.Decimal('0.00'),
        isActive: true,
      };

      modifierGroupFindUnique.mockResolvedValue(group);
      modifierCreate.mockResolvedValue(createdModifier);

      const result = await service.create(createDto);

      expect(modifierCreate).toHaveBeenCalledWith({
        data: {
          groupId: 'group-1',
          name: 'Extra Masala',
          sortOrder: 0,
          extraPrice: 0,
          isActive: true,
        },
      });

      expect(result).toEqual({
        group: {
          id: 'group-1',
          name: 'Dosa Extras',
          sortOrder: 1,
          minSelections: 0,
          maxSelections: 4,
          isActive: true,
        },
        modifier: {
          id: 'modifier-2',
          groupId: 'group-1',
          name: 'Extra Masala',
          sortOrder: 0,
          extraPrice: 0,
          isActive: true,
          createdAt: createdModifier.createdAt,
          updatedAt: createdModifier.updatedAt,
        },
      });
    });

    it('should throw NotFoundException when modifier group does not exist', async () => {
      const createDto: CreateModifierDto = {
        groupId: 'invalid-group',
        name: 'Extra Butter',
        sortOrder: 1,
        extraPrice: 20,
        isActive: true,
      };

      modifierGroupFindUnique.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        new NotFoundException('Modifier group not found'),
      );

      expect(modifierCreate).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when modifier group is inactive', async () => {
      const createDto: CreateModifierDto = {
        groupId: 'group-1',
        name: 'Extra Butter',
        sortOrder: 1,
        extraPrice: 20,
        isActive: true,
      };

      const inactiveGroup: ModifierGroup = {
        ...group,
        isActive: false,
      };

      modifierGroupFindUnique.mockResolvedValue(inactiveGroup);

      await expect(service.create(createDto)).rejects.toThrow(
        new BadRequestException(
          'Cannot add modifier to an inactive modifier group',
        ),
      );

      expect(modifierCreate).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // FIND ALL
  // ============================================================

  describe('findAll', () => {
    const group1: ModifierGroup = {
      id: 'group-1',
      name: 'Dosa Extras',
      sortOrder: 1,
      minSelections: 0,
      maxSelections: 4,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const group2: ModifierGroup = {
      id: 'group-2',
      name: 'Bread Extras',
      sortOrder: 5,
      minSelections: 0,
      maxSelections: 3,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const modifiers: ModifierWithGroup[] = [
      {
        id: 'modifier-1',
        groupId: 'group-1',
        name: 'Extra Butter',
        sortOrder: 1,
        extraPrice: new Prisma.Decimal('20.00'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        group: group1,
      },
      {
        id: 'modifier-2',
        groupId: 'group-1',
        name: 'Cheese',
        sortOrder: 2,
        extraPrice: new Prisma.Decimal('40.00'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        group: group1,
      },
      {
        id: 'modifier-3',
        groupId: 'group-2',
        name: 'Extra Garlic',
        sortOrder: 1,
        extraPrice: new Prisma.Decimal('20.00'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        group: group2,
      },
    ];

    it('should return modifiers grouped by modifier group', async () => {
      modifierFindMany.mockResolvedValue(modifiers);

      const result = await service.findAll();

      expect(modifierFindMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
        },
        include: {
          group: true,
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

      expect(result).toEqual([
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
              createdAt: modifiers[0].createdAt,
              updatedAt: modifiers[0].updatedAt,
            },
            {
              id: 'modifier-2',
              groupId: 'group-1',
              name: 'Cheese',
              sortOrder: 2,
              extraPrice: 40,
              isActive: true,
              createdAt: modifiers[1].createdAt,
              updatedAt: modifiers[1].updatedAt,
            },
          ],
        },
        {
          group: {
            id: 'group-2',
            name: 'Bread Extras',
            sortOrder: 5,
            minSelections: 0,
            maxSelections: 3,
            isActive: true,
          },
          modifiers: [
            {
              id: 'modifier-3',
              groupId: 'group-2',
              name: 'Extra Garlic',
              sortOrder: 1,
              extraPrice: 20,
              isActive: true,
              createdAt: modifiers[2].createdAt,
              updatedAt: modifiers[2].updatedAt,
            },
          ],
        },
      ]);
    });

    it('should filter modifiers by groupId', async () => {
      const groupModifiers: ModifierWithGroup[] = [modifiers[0], modifiers[1]];

      modifierFindMany.mockResolvedValue(groupModifiers);

      const result = await service.findAll('group-1');

      expect(modifierFindMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          groupId: 'group-1',
        },
        include: {
          group: true,
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

      expect(result).toHaveLength(1);
      expect(result[0].group.id).toBe('group-1');
      expect(result[0].modifiers).toHaveLength(2);
    });

    it('should return empty array when no active modifiers exist', async () => {
      modifierFindMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  // ============================================================
  // FIND ONE
  // ============================================================

  describe('findOne', () => {
    const group: ModifierGroup = {
      id: 'group-1',
      name: 'Dosa Extras',
      sortOrder: 1,
      minSelections: 0,
      maxSelections: 4,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const modifier: ModifierWithGroup = {
      id: 'modifier-1',
      groupId: 'group-1',
      name: 'Extra Butter',
      sortOrder: 1,
      extraPrice: new Prisma.Decimal('20.00'),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      group,
    };

    it('should return modifier with group', async () => {
      modifierFindUnique.mockResolvedValue(modifier);

      const result = await service.findOne('modifier-1');

      expect(modifierFindUnique).toHaveBeenCalledWith({
        where: {
          id: 'modifier-1',
        },
        include: {
          group: true,
        },
      });

      expect(result).toEqual({
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
          createdAt: modifier.createdAt,
          updatedAt: modifier.updatedAt,
        },
      });
    });

    it('should throw NotFoundException when modifier does not exist', async () => {
      modifierFindUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        new NotFoundException('Modifier not found'),
      );
    });
  });

  // ============================================================
  // UPDATE
  // ============================================================

  describe('update', () => {
    const existingModifier: Modifier = {
      id: 'modifier-1',
      groupId: 'group-1',
      name: 'Extra Butter',
      sortOrder: 1,
      extraPrice: new Prisma.Decimal('20.00'),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const group: ModifierGroup = {
      id: 'group-1',
      name: 'Dosa Extras',
      sortOrder: 1,
      minSelections: 0,
      maxSelections: 4,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should update modifier successfully', async () => {
      const updateDto: UpdateModifierDto = {
        name: 'Extra Butter Premium',
        extraPrice: 25,
      };

      const updatedModifier: ModifierWithGroup = {
        ...existingModifier,
        name: 'Extra Butter Premium',
        extraPrice: new Prisma.Decimal('25.00'),
        group,
      };

      modifierFindUnique.mockResolvedValue(existingModifier);

      modifierUpdate.mockResolvedValue(updatedModifier);

      const result = await service.update('modifier-1', updateDto);

      expect(modifierFindUnique).toHaveBeenCalledWith({
        where: {
          id: 'modifier-1',
        },
      });

      expect(modifierUpdate).toHaveBeenCalledWith({
        where: {
          id: 'modifier-1',
        },
        data: {
          name: 'Extra Butter Premium',
          extraPrice: 25,
        },
        include: {
          group: true,
        },
      });

      expect(result).toEqual({
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
          createdAt: updatedModifier.createdAt,
          updatedAt: updatedModifier.updatedAt,
        },
      });
    });

    it('should update only the provided fields', async () => {
      const updateDto: UpdateModifierDto = {
        sortOrder: 3,
      };

      const updatedModifier: ModifierWithGroup = {
        ...existingModifier,
        sortOrder: 3,
        group,
      };

      modifierFindUnique.mockResolvedValue(existingModifier);
      modifierUpdate.mockResolvedValue(updatedModifier);

      await service.update('modifier-1', updateDto);

      expect(modifierUpdate).toHaveBeenCalledWith({
        where: {
          id: 'modifier-1',
        },
        data: {
          sortOrder: 3,
        },
        include: {
          group: true,
        },
      });
    });

    it('should validate and update to a new active group', async () => {
      const newGroup: ModifierGroup = {
        ...group,
        id: 'group-2',
        name: 'Bread Extras',
        sortOrder: 5,
        maxSelections: 3,
      };

      const updatedModifier: ModifierWithGroup = {
        ...existingModifier,
        groupId: 'group-2',
        group: newGroup,
      };

      const updateDto: UpdateModifierDto = {
        groupId: 'group-2',
      };

      modifierFindUnique.mockResolvedValue(existingModifier);
      modifierGroupFindUnique.mockResolvedValue(newGroup);
      modifierUpdate.mockResolvedValue(updatedModifier);

      const result = await service.update('modifier-1', updateDto);

      expect(modifierGroupFindUnique).toHaveBeenCalledWith({
        where: {
          id: 'group-2',
        },
      });

      expect(modifierUpdate).toHaveBeenCalledWith({
        where: {
          id: 'modifier-1',
        },
        data: {
          groupId: 'group-2',
        },
        include: {
          group: true,
        },
      });

      expect(result).toEqual({
        group: {
          id: 'group-2',
          name: 'Bread Extras',
          sortOrder: 5,
          minSelections: 0,
          maxSelections: 3,
          isActive: true,
        },
        modifier: {
          id: 'modifier-1',
          groupId: 'group-2',
          name: 'Extra Butter',
          sortOrder: 1,
          extraPrice: 20,
          isActive: true,
          createdAt: updatedModifier.createdAt,
          updatedAt: updatedModifier.updatedAt,
        },
      });
    });

    it('should throw NotFoundException when modifier does not exist', async () => {
      const updateDto: UpdateModifierDto = {
        name: 'Updated Modifier',
      };

      modifierFindUnique.mockResolvedValue(null);

      await expect(service.update('invalid-id', updateDto)).rejects.toThrow(
        new NotFoundException('Modifier not found'),
      );

      expect(modifierUpdate).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when modifier is inactive', async () => {
      const inactiveModifier: Modifier = {
        ...existingModifier,
        isActive: false,
      };

      const updateDto: UpdateModifierDto = {
        name: 'Updated Modifier',
      };

      modifierFindUnique.mockResolvedValue(inactiveModifier);

      await expect(service.update('modifier-1', updateDto)).rejects.toThrow(
        new BadRequestException('Cannot update an inactive modifier'),
      );

      expect(modifierUpdate).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when new modifier group does not exist', async () => {
      const updateDto: UpdateModifierDto = {
        groupId: 'invalid-group',
      };

      modifierFindUnique.mockResolvedValue(existingModifier);
      modifierGroupFindUnique.mockResolvedValue(null);

      await expect(service.update('modifier-1', updateDto)).rejects.toThrow(
        new NotFoundException('Modifier group not found'),
      );

      expect(modifierUpdate).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when new modifier group is inactive', async () => {
      const inactiveGroup: ModifierGroup = {
        ...group,
        id: 'group-2',
        name: 'Inactive Group',
        isActive: false,
      };

      const updateDto: UpdateModifierDto = {
        groupId: 'group-2',
      };

      modifierFindUnique.mockResolvedValue(existingModifier);
      modifierGroupFindUnique.mockResolvedValue(inactiveGroup);

      await expect(service.update('modifier-1', updateDto)).rejects.toThrow(
        new BadRequestException(
          'Cannot assign modifier to an inactive modifier group',
        ),
      );

      expect(modifierUpdate).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // REMOVE
  // ============================================================

  describe('remove', () => {
    const activeModifier: Modifier = {
      id: 'modifier-1',
      groupId: 'group-1',
      name: 'Extra Butter',
      sortOrder: 1,
      extraPrice: new Prisma.Decimal('20.00'),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should soft delete modifier successfully', async () => {
      modifierFindUnique.mockResolvedValue(activeModifier);

      modifierUpdate.mockResolvedValue({
        ...activeModifier,
        isActive: false,
      });

      const result = await service.remove('modifier-1');

      expect(modifierFindUnique).toHaveBeenCalledWith({
        where: {
          id: 'modifier-1',
        },
      });

      expect(modifierUpdate).toHaveBeenCalledWith({
        where: {
          id: 'modifier-1',
        },
        data: {
          isActive: false,
        },
      });

      expect(result).toEqual({
        message: 'Modifier deleted successfully.',
      });
    });

    it('should throw NotFoundException when modifier does not exist', async () => {
      modifierFindUnique.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(
        new NotFoundException('Modifier not found'),
      );

      expect(modifierUpdate).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when modifier is already inactive', async () => {
      const inactiveModifier: Modifier = {
        ...activeModifier,
        isActive: false,
      };

      modifierFindUnique.mockResolvedValue(inactiveModifier);

      await expect(service.remove('modifier-1')).rejects.toThrow(
        new BadRequestException('Modifier is already inactive'),
      );

      expect(modifierUpdate).not.toHaveBeenCalled();
    });
  });
});
