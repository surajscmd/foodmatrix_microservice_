/*
  Warnings:

  - The `status` column on the `Restaurant` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[name]` on the table `Franchise` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[regionId,name]` on the table `Restaurant` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "RestaurantStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- AlterTable
ALTER TABLE "Franchise" ALTER COLUMN "defaultCurrency" SET DEFAULT 'INR';

-- AlterTable
ALTER TABLE "Restaurant" DROP COLUMN "status",
ADD COLUMN     "status" "RestaurantStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE UNIQUE INDEX "Franchise_name_key" ON "Franchise"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Restaurant_regionId_name_key" ON "Restaurant"("regionId", "name");
