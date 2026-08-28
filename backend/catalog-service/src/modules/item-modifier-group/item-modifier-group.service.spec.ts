import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import { ItemModifierGroupService } from './item-modifier-group.service';
import { PrismaService } from '../../lib/prisma/prisma.service';

describe('ItemModifierGroupService', () => {
  let service: ItemModifierGroupService;

  const prismaMock = {
    menuItem: {
      findUnique: jest.fn(),
    },
    modifierGroup: {
      findUnique: jest.fn(),
    },
    itemModifierGroup: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new ItemModifierGroupService(
      prismaMock as unknown as PrismaService,
    );
  });

  // ============================================================
  // CREATE
  // ============================================================

  describe('create', () => {
    const createDto = {
      menuItemId: 'menu-item-1',
      groupId: 'group-1',
    };

    const menuItem = {
      id: 'menu-item-1',
      name: 'Masala Dosa',
      sku: 'DOS-MAS-001',
    };

    const activeGroup = {
      id: 'group-1',
      name: 'Dosa Extras',
      isActive: true,
    };

    const createdRelation = {
      id: 'relation-1',
      menuItemId: 'menu-item-1',
      groupId: 'group-1',
      menuItem,
      group: {
        ...activeGroup,
        modifiers: [
          {
            id: 'modifier-1',
            name: 'Extra Butter',
            extraPrice: 20,
            isActive: true,
          },
        ],
      },
    };

    it('should assign modifier group to menu item successfully', async () => {
      prismaMock.menuItem.findUnique.mockResolvedValue(menuItem);
      prismaMock.modifierGroup.findUnique.mockResolvedValue(activeGroup);
      prismaMock.itemModifierGroup.findUnique.mockResolvedValue(null);
      prismaMock.itemModifierGroup.create.mockResolvedValue(createdRelation);

      const result = await service.create(createDto);

      expect(prismaMock.menuItem.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'menu-item-1',
        },
      });

      expect(prismaMock.modifierGroup.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'group-1',
        },
      });

      expect(prismaMock.itemModifierGroup.findUnique).toHaveBeenCalledWith({
        where: {
          menuItemId_groupId: {
            menuItemId: 'menu-item-1',
            groupId: 'group-1',
          },
        },
      });

      expect(prismaMock.itemModifierGroup.create).toHaveBeenCalledWith({
        data: {
          menuItemId: 'menu-item-1',
          groupId: 'group-1',
        },
        include: {
          menuItem: true,
          group: {
            include: {
              modifiers: true,
            },
          },
        },
      });

      expect(result).toEqual(createdRelation);
    });

    it('should throw NotFoundException when menu item does not exist', async () => {
      prismaMock.menuItem.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        new NotFoundException('Menu item not found'),
      );

      expect(prismaMock.modifierGroup.findUnique).not.toHaveBeenCalled();

      expect(prismaMock.itemModifierGroup.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when modifier group does not exist', async () => {
      prismaMock.menuItem.findUnique.mockResolvedValue(menuItem);
      prismaMock.modifierGroup.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        new NotFoundException('Modifier group not found'),
      );

      expect(prismaMock.itemModifierGroup.findUnique).not.toHaveBeenCalled();

      expect(prismaMock.itemModifierGroup.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when modifier group is inactive', async () => {
      prismaMock.menuItem.findUnique.mockResolvedValue(menuItem);
      prismaMock.modifierGroup.findUnique.mockResolvedValue({
        ...activeGroup,
        isActive: false,
      });

      await expect(service.create(createDto)).rejects.toThrow(
        new BadRequestException('Cannot assign an inactive modifier group'),
      );

      expect(prismaMock.itemModifierGroup.findUnique).not.toHaveBeenCalled();

      expect(prismaMock.itemModifierGroup.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when assignment already exists', async () => {
      prismaMock.menuItem.findUnique.mockResolvedValue(menuItem);
      prismaMock.modifierGroup.findUnique.mockResolvedValue(activeGroup);
      prismaMock.itemModifierGroup.findUnique.mockResolvedValue({
        id: 'existing-relation',
        menuItemId: 'menu-item-1',
        groupId: 'group-1',
      });

      await expect(service.create(createDto)).rejects.toThrow(
        new ConflictException(
          'Modifier group is already assigned to this menu item',
        ),
      );

      expect(prismaMock.itemModifierGroup.create).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // FIND ALL
  // ============================================================

  describe('findAll', () => {
    const relations = [
      {
        id: 'relation-1',
        menuItemId: 'menu-item-1',
        groupId: 'group-1',
        menuItem: {
          id: 'menu-item-1',
          name: 'Masala Dosa',
        },
        group: {
          id: 'group-1',
          name: 'Dosa Extras',
          modifiers: [
            {
              id: 'modifier-1',
              name: 'Extra Butter',
              extraPrice: 20,
              isActive: true,
            },
          ],
        },
      },
    ];

    it('should return all modifier group assignments', async () => {
      prismaMock.itemModifierGroup.findMany.mockResolvedValue(relations);

      const result = await service.findAll();

      expect(prismaMock.itemModifierGroup.findMany).toHaveBeenCalledWith({
        where: undefined,
        include: {
          menuItem: true,
          group: {
            include: {
              modifiers: {
                where: {
                  isActive: true,
                },
                orderBy: {
                  sortOrder: 'asc',
                },
              },
            },
          },
        },
        orderBy: {
          group: {
            sortOrder: 'asc',
          },
        },
      });

      expect(result).toEqual(relations);
    });

    it('should return assignments for a specific menu item', async () => {
      prismaMock.itemModifierGroup.findMany.mockResolvedValue(relations);

      const result = await service.findAll('menu-item-1');

      expect(prismaMock.itemModifierGroup.findMany).toHaveBeenCalledWith({
        where: {
          menuItemId: 'menu-item-1',
        },
        include: {
          menuItem: true,
          group: {
            include: {
              modifiers: {
                where: {
                  isActive: true,
                },
                orderBy: {
                  sortOrder: 'asc',
                },
              },
            },
          },
        },
        orderBy: {
          group: {
            sortOrder: 'asc',
          },
        },
      });

      expect(result).toEqual(relations);
    });

    it('should return empty array when no assignments exist', async () => {
      prismaMock.itemModifierGroup.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  // ============================================================
  // FIND ONE
  // ============================================================

  describe('findOne', () => {
    const relation = {
      id: 'relation-1',
      menuItemId: 'menu-item-1',
      groupId: 'group-1',
      menuItem: {
        id: 'menu-item-1',
        name: 'Masala Dosa',
      },
      group: {
        id: 'group-1',
        name: 'Dosa Extras',
        modifiers: [
          {
            id: 'modifier-1',
            name: 'Extra Butter',
            extraPrice: 20,
            isActive: true,
          },
        ],
      },
    };

    it('should return the modifier group assignment', async () => {
      prismaMock.itemModifierGroup.findUnique.mockResolvedValue(relation);

      const result = await service.findOne('menu-item-1', 'group-1');

      expect(prismaMock.itemModifierGroup.findUnique).toHaveBeenCalledWith({
        where: {
          menuItemId_groupId: {
            menuItemId: 'menu-item-1',
            groupId: 'group-1',
          },
        },
        include: {
          menuItem: true,
          group: {
            include: {
              modifiers: {
                where: {
                  isActive: true,
                },
                orderBy: {
                  sortOrder: 'asc',
                },
              },
            },
          },
        },
      });

      expect(result).toEqual(relation);
    });

    it('should throw NotFoundException when assignment does not exist', async () => {
      prismaMock.itemModifierGroup.findUnique.mockResolvedValue(null);

      await expect(service.findOne('menu-item-1', 'group-1')).rejects.toThrow(
        new NotFoundException('Modifier group assignment not found'),
      );
    });
  });

  // ============================================================
  // REMOVE
  // ============================================================

  describe('remove', () => {
    it('should remove modifier group assignment successfully', async () => {
      const relation = {
        id: 'relation-1',
        menuItemId: 'menu-item-1',
        groupId: 'group-1',
        menuItem: {
          id: 'menu-item-1',
          name: 'Masala Dosa',
        },
        group: {
          id: 'group-1',
          name: 'Dosa Extras',
          modifiers: [],
        },
      };

      prismaMock.itemModifierGroup.findUnique.mockResolvedValue(relation);

      prismaMock.itemModifierGroup.delete.mockResolvedValue(relation);

      const result = await service.remove('menu-item-1', 'group-1');

      expect(prismaMock.itemModifierGroup.findUnique).toHaveBeenCalledWith({
        where: {
          menuItemId_groupId: {
            menuItemId: 'menu-item-1',
            groupId: 'group-1',
          },
        },
        include: {
          menuItem: true,
          group: {
            include: {
              modifiers: {
                where: {
                  isActive: true,
                },
                orderBy: {
                  sortOrder: 'asc',
                },
              },
            },
          },
        },
      });

      expect(prismaMock.itemModifierGroup.delete).toHaveBeenCalledWith({
        where: {
          menuItemId_groupId: {
            menuItemId: 'menu-item-1',
            groupId: 'group-1',
          },
        },
      });

      expect(result).toEqual({
        message: 'Modifier group removed from menu item successfully.',
      });
    });

    it('should throw NotFoundException when removing non-existing assignment', async () => {
      prismaMock.itemModifierGroup.findUnique.mockResolvedValue(null);

      await expect(service.remove('menu-item-1', 'group-1')).rejects.toThrow(
        new NotFoundException('Modifier group assignment not found'),
      );

      expect(prismaMock.itemModifierGroup.delete).not.toHaveBeenCalled();
    });
  });
});
