-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SYSTEM', 'LOW_STOCK', 'STOCK_REQUEST_CREATED', 'STOCK_REQUEST_APPROVED', 'STOCK_SHIPPED', 'STOCK_RECEIVED', 'ORDER', 'EMPLOYEE_SIGNED_IN', 'EMPLOYEE_LATE', 'LEAVE_APPLIED', 'ALERT');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "NotificationScope" AS ENUM ('RESTAURANT', 'WAREHOUSE');

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "scope" "NotificationScope" NOT NULL,
    "restaurantId" TEXT,
    "warehouseId" TEXT,
    "type" "NotificationType" NOT NULL,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_restaurantId_idx" ON "Notification"("restaurantId");

-- CreateIndex
CREATE INDEX "Notification_warehouseId_idx" ON "Notification"("warehouseId");

-- CreateIndex
CREATE INDEX "Notification_scope_idx" ON "Notification"("scope");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");
