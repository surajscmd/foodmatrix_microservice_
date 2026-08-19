/*
  Warnings:

  - A unique constraint covering the columns `[restaurantId,employeeCode]` on the table `Staff` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `employeeCode` to the `Staff` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "employeeCode" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Staff_restaurantId_employeeCode_key" ON "Staff"("restaurantId", "employeeCode");
