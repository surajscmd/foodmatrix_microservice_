/*
  Warnings:

  - Added the required column `warehouseId` to the `StockRequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "StockRequest" ADD COLUMN     "warehouseId" TEXT NOT NULL;
