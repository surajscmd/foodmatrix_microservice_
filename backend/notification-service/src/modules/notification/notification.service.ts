import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  NotificationScope,
  Prisma,
  type NotificationPriority,
} from '@prisma/client';

import { PrismaService } from '../../lib/prisma/prisma.service.js';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // RESTAURANT NOTIFICATIONS
  // ============================================================

  /**
   * Get notifications belonging to a restaurant.
   */
  async findByRestaurant(
    restaurantId: string,
    page: number,
    limit: number,
    isRead?: string,
    priority?: NotificationPriority,
    search?: string,
  ) {
    const readFilter = this.parseIsRead(isRead);
    const term = search?.trim();

    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {
      scope: NotificationScope.RESTAURANT,

      restaurantId,
      priority,
      ...(term
        ? {
            OR: [
              { title: { contains: term, mode: 'insensitive' } },
              { message: { contains: term, mode: 'insensitive' } },
            ],
          }
        : {}),

      ...(readFilter !== undefined
        ? {
            isRead: readFilter,
          }
        : {}),
    };

    const [notifications, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,

        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],

        skip,

        take: limit,
      }),

      this.prisma.notification.count({
        where,
      }),
    ]);

    return {
      message: 'Restaurant notifications fetched successfully',

      data: notifications,

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ============================================================
  // WAREHOUSE NOTIFICATIONS
  // ============================================================

  /**
   * Get notifications belonging to a warehouse.
   */
  async findByWarehouse(
    warehouseId: string,
    page: number,
    limit: number,
    isRead?: string,
  ) {
    const readFilter = this.parseIsRead(isRead);

    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {
      scope: NotificationScope.WAREHOUSE,

      warehouseId,

      ...(readFilter !== undefined
        ? {
            isRead: readFilter,
          }
        : {}),
    };

    const [notifications, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,

        orderBy: {
          createdAt: 'desc',
        },

        skip,

        take: limit,
      }),

      this.prisma.notification.count({
        where,
      }),
    ]);

    return {
      message: 'Warehouse notifications fetched successfully',

      data: notifications,

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ============================================================
  // FIND ONE
  // ============================================================

  /**
   * Get a single notification by ID.
   */
  async findOne(id: string) {
    const notification = await this.prisma.notification.findUnique({
      where: {
        id,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return {
      message: 'Notification fetched successfully',

      data: notification,
    };
  }

  // ============================================================
  // MARK AS READ
  // ============================================================

  /**
   * Mark one notification as read.
   */
  async markAsRead(id: string) {
    const notification = await this.prisma.notification.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        isRead: true,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.isRead) {
      return {
        message: 'Notification already marked as read',
      };
    }

    const updatedNotification = await this.prisma.notification.update({
      where: {
        id,
      },

      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return {
      message: 'Notification marked as read successfully',

      data: updatedNotification,
    };
  }

  // ============================================================
  // MARK RESTAURANT NOTIFICATIONS AS READ
  // ============================================================

  /**
   * Mark all unread notifications for a restaurant as read.
   */
  async markRestaurantAsRead(restaurantId: string) {
    const result = await this.prisma.notification.updateMany({
      where: {
        scope: NotificationScope.RESTAURANT,

        restaurantId,

        isRead: false,
      },

      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return {
      message: 'Restaurant notifications marked as read successfully',

      data: {
        updatedCount: result.count,
      },
    };
  }

  // ============================================================
  // MARK WAREHOUSE NOTIFICATIONS AS READ
  // ============================================================

  /**
   * Mark all unread notifications for a warehouse as read.
   */
  async markWarehouseAsRead(warehouseId: string) {
    const result = await this.prisma.notification.updateMany({
      where: {
        scope: NotificationScope.WAREHOUSE,

        warehouseId,

        isRead: false,
      },

      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return {
      message: 'Warehouse notifications marked as read successfully',

      data: {
        updatedCount: result.count,
      },
    };
  }

  // ============================================================
  // HELPERS
  // ============================================================

  /**
   * Convert the query string into a boolean.
   */
  private parseIsRead(value?: string): boolean | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (value !== 'true' && value !== 'false') {
      throw new BadRequestException('isRead must be either true or false');
    }

    return value === 'true';
  }
}
