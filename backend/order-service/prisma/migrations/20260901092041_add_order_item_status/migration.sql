-- CreateEnum
CREATE TYPE "OrderItemStatus" AS ENUM ('PENDING', 'PREPARING', 'READY', 'CANCELLED');

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "status" "OrderItemStatus" NOT NULL DEFAULT 'PENDING';
