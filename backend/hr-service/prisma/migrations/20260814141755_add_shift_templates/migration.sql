-- CreateEnum
CREATE TYPE "ShiftTemplateStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ShiftScheduleStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'MISSED');

-- AlterTable
ALTER TABLE "Leave" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "reason" TEXT,
ADD COLUMN     "totalDays" DECIMAL(5,2);

-- AlterTable
ALTER TABLE "WageHistory" ADD COLUMN     "salaryAmount" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "ShiftTemplate" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ShiftType" NOT NULL,
    "status" "ShiftTemplateStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShiftTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftTemplateSegment" (
    "id" TEXT NOT NULL,
    "shiftTemplateId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "crossesMidnight" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShiftTemplateSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftSchedule" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "shiftTemplateId" TEXT NOT NULL,
    "scheduledStart" TIMESTAMP(3) NOT NULL,
    "scheduledEnd" TIMESTAMP(3) NOT NULL,
    "status" "ShiftScheduleStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShiftSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShiftTemplate_restaurantId_idx" ON "ShiftTemplate"("restaurantId");

-- CreateIndex
CREATE INDEX "ShiftTemplate_restaurantId_status_idx" ON "ShiftTemplate"("restaurantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ShiftTemplate_restaurantId_name_key" ON "ShiftTemplate"("restaurantId", "name");

-- CreateIndex
CREATE INDEX "ShiftTemplateSegment_shiftTemplateId_idx" ON "ShiftTemplateSegment"("shiftTemplateId");

-- CreateIndex
CREATE UNIQUE INDEX "ShiftTemplateSegment_shiftTemplateId_sequence_key" ON "ShiftTemplateSegment"("shiftTemplateId", "sequence");

-- CreateIndex
CREATE INDEX "ShiftSchedule_restaurantId_scheduledStart_idx" ON "ShiftSchedule"("restaurantId", "scheduledStart");

-- CreateIndex
CREATE INDEX "ShiftSchedule_staffId_scheduledStart_idx" ON "ShiftSchedule"("staffId", "scheduledStart");

-- CreateIndex
CREATE INDEX "ShiftSchedule_shiftTemplateId_idx" ON "ShiftSchedule"("shiftTemplateId");

-- AddForeignKey
ALTER TABLE "ShiftTemplateSegment" ADD CONSTRAINT "ShiftTemplateSegment_shiftTemplateId_fkey" FOREIGN KEY ("shiftTemplateId") REFERENCES "ShiftTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftSchedule" ADD CONSTRAINT "ShiftSchedule_shiftTemplateId_fkey" FOREIGN KEY ("shiftTemplateId") REFERENCES "ShiftTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
