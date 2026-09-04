/*
  Warnings:

  - You are about to drop the `InventoryEvent` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "StockMovement" ADD COLUMN     "reason" VARCHAR(255);

-- DropTable
DROP TABLE "InventoryEvent";
