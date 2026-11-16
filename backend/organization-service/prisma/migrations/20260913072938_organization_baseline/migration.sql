-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "RestaurantStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "SystemUserRole" AS ENUM ('SUPER_ADMIN', 'FRANCHISE_ADMIN', 'REGIONAL_ADMIN', 'RESTAURANT_ADMIN');

-- CreateEnum
CREATE TYPE "TerminalType" AS ENUM ('ORDER', 'KITCHEN', 'ATTENDANCE');

-- CreateTable
CREATE TABLE "Franchise" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "taxId" TEXT,
    "defaultCurrency" TEXT NOT NULL DEFAULT 'INR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Franchise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Region" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "franchiseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Restaurant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "country" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "status" "RestaurantStatus" NOT NULL DEFAULT 'ACTIVE',
    "regionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Restaurant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemUser" (
    "id" TEXT NOT NULL,
    "authUserId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "SystemUserRole" NOT NULL,
    "franchiseId" TEXT,
    "managedRegionId" TEXT,
    "managedRestaurantId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Terminal" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TerminalType" NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "pairingCode" TEXT,
    "isPaired" BOOLEAN NOT NULL DEFAULT false,
    "deviceModel" TEXT,
    "lastPingAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Terminal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Franchise_name_key" ON "Franchise"("name");

-- CreateIndex
CREATE INDEX "Region_franchiseId_idx" ON "Region"("franchiseId");

-- CreateIndex
CREATE UNIQUE INDEX "Region_franchiseId_name_key" ON "Region"("franchiseId", "name");

-- CreateIndex
CREATE INDEX "Restaurant_regionId_idx" ON "Restaurant"("regionId");

-- CreateIndex
CREATE UNIQUE INDEX "Restaurant_regionId_name_key" ON "Restaurant"("regionId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "SystemUser_authUserId_key" ON "SystemUser"("authUserId");

-- CreateIndex
CREATE UNIQUE INDEX "SystemUser_email_key" ON "SystemUser"("email");

-- CreateIndex
CREATE INDEX "SystemUser_franchiseId_idx" ON "SystemUser"("franchiseId");

-- CreateIndex
CREATE INDEX "SystemUser_managedRegionId_idx" ON "SystemUser"("managedRegionId");

-- CreateIndex
CREATE INDEX "SystemUser_managedRestaurantId_idx" ON "SystemUser"("managedRestaurantId");

-- CreateIndex
CREATE UNIQUE INDEX "Terminal_pairingCode_key" ON "Terminal"("pairingCode");

-- CreateIndex
CREATE INDEX "Terminal_restaurantId_idx" ON "Terminal"("restaurantId");

-- CreateIndex
CREATE INDEX "Terminal_restaurantId_type_idx" ON "Terminal"("restaurantId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Terminal_restaurantId_name_key" ON "Terminal"("restaurantId", "name");

-- AddForeignKey
ALTER TABLE "Region" ADD CONSTRAINT "Region_franchiseId_fkey" FOREIGN KEY ("franchiseId") REFERENCES "Franchise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Restaurant" ADD CONSTRAINT "Restaurant_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemUser" ADD CONSTRAINT "SystemUser_franchiseId_fkey" FOREIGN KEY ("franchiseId") REFERENCES "Franchise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemUser" ADD CONSTRAINT "SystemUser_managedRegionId_fkey" FOREIGN KEY ("managedRegionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemUser" ADD CONSTRAINT "SystemUser_managedRestaurantId_fkey" FOREIGN KEY ("managedRestaurantId") REFERENCES "Restaurant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Terminal" ADD CONSTRAINT "Terminal_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

