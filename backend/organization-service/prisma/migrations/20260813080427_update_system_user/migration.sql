/*
  Warnings:

  - You are about to drop the column `passwordHash` on the `SystemUser` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[franchiseId,name]` on the table `Region` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[authUserId]` on the table `SystemUser` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[restaurantId,name]` on the table `Terminal` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `authUserId` to the `SystemUser` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `role` on the `SystemUser` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `type` to the `Terminal` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SystemUserRole" AS ENUM ('SUPER_ADMIN', 'FRANCHISE_ADMIN', 'REGIONAL_ADMIN', 'RESTAURANT_ADMIN');

-- CreateEnum
CREATE TYPE "TerminalType" AS ENUM ('ORDER', 'KITCHEN', 'ATTENDANCE');

-- DropForeignKey
ALTER TABLE "SystemUser" DROP CONSTRAINT "SystemUser_franchiseId_fkey";

-- AlterTable
ALTER TABLE "SystemUser" DROP COLUMN "passwordHash",
ADD COLUMN     "authUserId" TEXT NOT NULL,
DROP COLUMN "role",
ADD COLUMN     "role" "SystemUserRole" NOT NULL,
ALTER COLUMN "franchiseId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Terminal" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "type" "TerminalType" NOT NULL;

-- CreateIndex
CREATE INDEX "Region_franchiseId_idx" ON "Region"("franchiseId");

-- CreateIndex
CREATE UNIQUE INDEX "Region_franchiseId_name_key" ON "Region"("franchiseId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "SystemUser_authUserId_key" ON "SystemUser"("authUserId");

-- CreateIndex
CREATE INDEX "SystemUser_franchiseId_idx" ON "SystemUser"("franchiseId");

-- CreateIndex
CREATE INDEX "SystemUser_managedRegionId_idx" ON "SystemUser"("managedRegionId");

-- CreateIndex
CREATE INDEX "SystemUser_managedRestaurantId_idx" ON "SystemUser"("managedRestaurantId");

-- CreateIndex
CREATE INDEX "Terminal_restaurantId_type_idx" ON "Terminal"("restaurantId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Terminal_restaurantId_name_key" ON "Terminal"("restaurantId", "name");

-- AddForeignKey
ALTER TABLE "SystemUser" ADD CONSTRAINT "SystemUser_franchiseId_fkey" FOREIGN KEY ("franchiseId") REFERENCES "Franchise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemUser" ADD CONSTRAINT "SystemUser_managedRegionId_fkey" FOREIGN KEY ("managedRegionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;
