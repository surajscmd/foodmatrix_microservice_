import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  NotificationPriority,
  NotificationScope,
  NotificationType,
  PrismaClient,
} from '@prisma/client';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is missing in environment');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const DEFAULT_WAREHOUSE_ID = '1b88b4d7-4caa-467a-89e0-0eedafd9b059';
const INDIRANAGAR_ID = 'd1a7c4b0-1001-4a2b-8c3d-111111111111';
const WHITEFIELD_ID = 'd1a7c4b0-1002-4a2b-8c3d-222222222222';
const KORAMANGALA_ID = 'd1a7c4b0-1003-4a2b-8c3d-333333333333';

async function resolveWarehouseId(): Promise<string> {
  if (process.env.WAREHOUSE_ID) return process.env.WAREHOUSE_ID;

  const orgUrl = process.env.ORGANIZATION_DATABASE_URL;
  if (!orgUrl) return DEFAULT_WAREHOUSE_ID;

  const pool = new Pool({ connectionString: orgUrl });
  try {
    const res = await pool.query<{ id: string }>(
      'SELECT id FROM "Franchise" ORDER BY "createdAt" ASC LIMIT 1',
    );
    if (res.rows[0]?.id) {
      console.log(`Resolved franchise/warehouse ID from ORGANIZATION_DATABASE_URL: ${res.rows[0].id}`);
      return res.rows[0].id;
    }
  } finally {
    await pool.end();
  }
  return DEFAULT_WAREHOUSE_ID;
}

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

async function main() {
  console.log('Seeding notification-service...');
  const WAREHOUSE_ID = await resolveWarehouseId();

  const notifications = [
    {
      id: 'e0000000-0000-4000-8000-000000000001',
      scope: NotificationScope.WAREHOUSE,
      restaurantId: INDIRANAGAR_ID,
      warehouseId: WAREHOUSE_ID,
      type: NotificationType.STOCK_REQUEST_CREATED,
      priority: NotificationPriority.HIGH,
      title: 'New Stock Request',
      message:
        'FoodMatrix Indiranagar submitted a replenishment request for Paneer, Butter, and Cream.',
      referenceId: 'd2000000-0000-4000-8000-000000000001',
      referenceType: 'StockRequest',
      isRead: false,
      readAt: null,
      createdAt: hoursAgo(1),
    },
    {
      id: 'e0000000-0000-4000-8000-000000000002',
      scope: NotificationScope.WAREHOUSE,
      restaurantId: WHITEFIELD_ID,
      warehouseId: WAREHOUSE_ID,
      type: NotificationType.ALERT,
      priority: NotificationPriority.CRITICAL,
      title: 'Transfer Discrepancy Reported',
      message:
        'FoodMatrix Whitefield reported a short receipt on Basmati Rice during transfer delivery.',
      referenceId: 'd4000000-0000-4000-8000-000000000003',
      referenceType: 'StockTransfer',
      isRead: false,
      readAt: null,
      createdAt: hoursAgo(3),
    },
    {
      id: 'e0000000-0000-4000-8000-000000000003',
      scope: NotificationScope.WAREHOUSE,
      restaurantId: KORAMANGALA_ID,
      warehouseId: WAREHOUSE_ID,
      type: NotificationType.STOCK_RECEIVED,
      priority: NotificationPriority.NORMAL,
      title: 'Shipment Received',
      message:
        'FoodMatrix Koramangala confirmed receipt of the weekly dry goods shipment.',
      referenceId: 'd4000000-0000-4000-8000-000000000001',
      referenceType: 'StockTransfer',
      isRead: true,
      readAt: hoursAgo(10),
      createdAt: hoursAgo(14),
    },
    {
      id: 'e0000000-0000-4000-8000-000000000004',
      scope: NotificationScope.WAREHOUSE,
      restaurantId: null,
      warehouseId: WAREHOUSE_ID,
      type: NotificationType.SYSTEM,
      priority: NotificationPriority.LOW,
      title: 'Weekly Warehouse Audit Ready',
      message:
        'All 92 catalog ingredients in Central Warehouse Bengaluru are balanced.',
      referenceId: WAREHOUSE_ID,
      referenceType: 'WarehouseStock',
      isRead: true,
      readAt: hoursAgo(24),
      createdAt: hoursAgo(36),
    },
    {
      id: 'e0000000-0000-4000-8000-000000000005',
      scope: NotificationScope.RESTAURANT,
      restaurantId: INDIRANAGAR_ID,
      warehouseId: WAREHOUSE_ID,
      type: NotificationType.LOW_STOCK,
      priority: NotificationPriority.HIGH,
      title: 'Low Stock Alert',
      message:
        '3 ingredients are below the reorder level: Paneer, Butter, Cream.',
      referenceId: INDIRANAGAR_ID,
      referenceType: 'RestaurantStock',
      isRead: false,
      readAt: null,
      createdAt: hoursAgo(0.5),
    },
    {
      id: 'e0000000-0000-4000-8000-000000000006',
      scope: NotificationScope.RESTAURANT,
      restaurantId: INDIRANAGAR_ID,
      warehouseId: WAREHOUSE_ID,
      type: NotificationType.STOCK_SHIPPED,
      priority: NotificationPriority.NORMAL,
      title: 'Shipment Dispatched',
      message:
        'Central Warehouse dispatched your replenishment transfer (Tracking: FM-BLR-2041).',
      referenceId: 'd4000000-0000-4000-8000-000000000002',
      referenceType: 'StockTransfer',
      isRead: false,
      readAt: null,
      createdAt: hoursAgo(2),
    },
    {
      id: 'e0000000-0000-4000-8000-000000000007',
      scope: NotificationScope.RESTAURANT,
      restaurantId: INDIRANAGAR_ID,
      warehouseId: null,
      type: NotificationType.EMPLOYEE_LATE,
      priority: NotificationPriority.NORMAL,
      title: 'Employee Late',
      message: 'Deepika Rao clocked in 20 minutes after shift start.',
      referenceId: 'b5000000-0000-4000-8000-000000000003',
      referenceType: 'Shift',
      isRead: true,
      readAt: hoursAgo(12),
      createdAt: hoursAgo(20),
    },
    {
      id: 'e0000000-0000-4000-8000-000000000008',
      scope: NotificationScope.RESTAURANT,
      restaurantId: INDIRANAGAR_ID,
      warehouseId: null,
      type: NotificationType.EMPLOYEE_SIGNED_IN,
      priority: NotificationPriority.LOW,
      title: 'Employee Clocked In',
      message: 'Arjun Shetty clocked in for Morning Breakfast & Lunch.',
      referenceId: 'b5000000-0000-4000-8000-000000000004',
      referenceType: 'Shift',
      isRead: true,
      readAt: hoursAgo(4),
      createdAt: hoursAgo(5),
    },
    {
      id: 'e0000000-0000-4000-8000-000000000009',
      scope: NotificationScope.RESTAURANT,
      restaurantId: WHITEFIELD_ID,
      warehouseId: WAREHOUSE_ID,
      type: NotificationType.STOCK_REQUEST_APPROVED,
      priority: NotificationPriority.NORMAL,
      title: 'Stock Request Approved',
      message:
        'Warehouse approved your stock request for Chicken, Basmati Rice, and Oil.',
      referenceId: 'd2000000-0000-4000-8000-000000000002',
      referenceType: 'StockRequest',
      isRead: false,
      readAt: null,
      createdAt: hoursAgo(4),
    },
    {
      id: 'e0000000-0000-4000-8000-000000000010',
      scope: NotificationScope.RESTAURANT,
      restaurantId: WHITEFIELD_ID,
      warehouseId: null,
      type: NotificationType.LEAVE_APPLIED,
      priority: NotificationPriority.NORMAL,
      title: 'Leave Request Pending',
      message: 'Sneha Patel applied for 2 days of casual leave.',
      referenceId: 'b6000000-0000-4000-8000-000000000002',
      referenceType: 'Leave',
      isRead: false,
      readAt: null,
      createdAt: hoursAgo(6),
    },
    {
      id: 'e0000000-0000-4000-8000-000000000011',
      scope: NotificationScope.RESTAURANT,
      restaurantId: KORAMANGALA_ID,
      warehouseId: WAREHOUSE_ID,
      type: NotificationType.LOW_STOCK,
      priority: NotificationPriority.HIGH,
      title: 'Low Stock Alert',
      message: 'Dosa Batter is below the reorder level.',
      referenceId: KORAMANGALA_ID,
      referenceType: 'RestaurantStock',
      isRead: false,
      readAt: null,
      createdAt: hoursAgo(1.5),
    },
    {
      id: 'e0000000-0000-4000-8000-000000000012',
      scope: NotificationScope.RESTAURANT,
      restaurantId: KORAMANGALA_ID,
      warehouseId: null,
      type: NotificationType.ORDER,
      priority: NotificationPriority.LOW,
      title: 'High Dinner Volume',
      message: 'Table T-04 order is ready for cashier settlement.',
      referenceId: 'c1000000-0000-4000-8000-000000000010',
      referenceType: 'Order',
      isRead: true,
      readAt: hoursAgo(2),
      createdAt: hoursAgo(3),
    },
  ];

  for (const n of notifications) {
    await prisma.notification.upsert({
      where: { id: n.id },
      update: {
        warehouseId: n.warehouseId,
        title: n.title,
        message: n.message,
      },
      create: n,
    });
  }

  console.log(`Notification seed complete: ${notifications.length} notifications.`);
}

main()
  .catch((error) => {
    console.error('Notification seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
