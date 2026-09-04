-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('WAREHOUSE', 'RESTAURANT', 'TRANSIT');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('POS_SALE', 'PURCHASE', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADJUSTMENT', 'WASTE');

-- CreateEnum
CREATE TYPE "StockRequestStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'FULFILLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('REQUESTED', 'APPROVED', 'PICKING', 'READY_TO_SHIP', 'SHIPPED', 'IN_TRANSIT', 'RECEIVED', 'DISPUTED', 'COMPLETED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TransferDiscrepancyType" AS ENUM ('SHORT_RECEIPT', 'DAMAGED', 'MISSING', 'WRONG_ITEM', 'OTHER');

-- CreateTable
CREATE TABLE "WarehouseStock" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "quantityOnHand" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WarehouseStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RestaurantStock" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "quantityOnHand" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "reorderLevel" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "reorderQuantity" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RestaurantStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "locationType" "LocationType" NOT NULL,
    "locationId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "movementType" "MovementType" NOT NULL,
    "quantityChange" DECIMAL(12,4) NOT NULL,
    "referenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockRequest" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "rejectedBy" TEXT,
    "status" "StockRequestStatus" NOT NULL DEFAULT 'REQUESTED',
    "reason" TEXT,
    "rejectionReason" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "fulfilledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockRequestItem" (
    "id" TEXT NOT NULL,
    "stockRequestId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "requestedQty" DECIMAL(12,4) NOT NULL,
    "approvedQty" DECIMAL(12,4),

    CONSTRAINT "StockRequestItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockTransfer" (
    "id" TEXT NOT NULL,
    "stockRequestId" TEXT,
    "fromWarehouseId" TEXT NOT NULL,
    "toRestaurantId" TEXT NOT NULL,
    "status" "TransferStatus" NOT NULL DEFAULT 'REQUESTED',
    "requestedBy" TEXT,
    "approvedBy" TEXT,
    "rejectedBy" TEXT,
    "shippedBy" TEXT,
    "receivedBy" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "shippedAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockTransferItem" (
    "id" TEXT NOT NULL,
    "transferId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "requestedQty" DECIMAL(12,4) NOT NULL,
    "approvedQty" DECIMAL(12,4),
    "shippedQty" DECIMAL(12,4),
    "receivedQty" DECIMAL(12,4),

    CONSTRAINT "StockTransferItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL,
    "transferId" TEXT NOT NULL,
    "carrierName" TEXT,
    "trackingNumber" TEXT,
    "shipperName" TEXT,
    "shipperPhone" TEXT,
    "driverName" TEXT,
    "driverPhone" TEXT,
    "vehicleNumber" TEXT,
    "vehicleType" TEXT,
    "dispatchLocation" TEXT,
    "deliveryLocation" TEXT,
    "estimatedArrival" TIMESTAMP(3),
    "dispatchedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryTransit" (
    "id" TEXT NOT NULL,
    "transferId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "quantity" DECIMAL(12,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryTransit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransferDiscrepancy" (
    "id" TEXT NOT NULL,
    "transferId" TEXT NOT NULL,
    "transferItemId" TEXT NOT NULL,
    "type" "TransferDiscrepancyType" NOT NULL,
    "expectedQty" DECIMAL(12,4),
    "actualQty" DECIMAL(12,4),
    "reason" TEXT,
    "reportedBy" TEXT NOT NULL,
    "resolvedBy" TEXT,
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "TransferDiscrepancy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WasteLog" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "qty" DECIMAL(12,4) NOT NULL,
    "reason" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WasteLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WarehouseStock_warehouseId_idx" ON "WarehouseStock"("warehouseId");

-- CreateIndex
CREATE INDEX "WarehouseStock_ingredientId_idx" ON "WarehouseStock"("ingredientId");

-- CreateIndex
CREATE UNIQUE INDEX "WarehouseStock_warehouseId_ingredientId_key" ON "WarehouseStock"("warehouseId", "ingredientId");

-- CreateIndex
CREATE INDEX "RestaurantStock_restaurantId_idx" ON "RestaurantStock"("restaurantId");

-- CreateIndex
CREATE INDEX "RestaurantStock_ingredientId_idx" ON "RestaurantStock"("ingredientId");

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantStock_restaurantId_ingredientId_key" ON "RestaurantStock"("restaurantId", "ingredientId");

-- CreateIndex
CREATE INDEX "StockMovement_locationType_locationId_idx" ON "StockMovement"("locationType", "locationId");

-- CreateIndex
CREATE INDEX "StockMovement_ingredientId_idx" ON "StockMovement"("ingredientId");

-- CreateIndex
CREATE INDEX "StockMovement_movementType_idx" ON "StockMovement"("movementType");

-- CreateIndex
CREATE INDEX "StockMovement_referenceId_idx" ON "StockMovement"("referenceId");

-- CreateIndex
CREATE INDEX "StockMovement_createdAt_idx" ON "StockMovement"("createdAt");

-- CreateIndex
CREATE INDEX "StockRequest_restaurantId_idx" ON "StockRequest"("restaurantId");

-- CreateIndex
CREATE INDEX "StockRequest_status_idx" ON "StockRequest"("status");

-- CreateIndex
CREATE INDEX "StockRequest_requestedBy_idx" ON "StockRequest"("requestedBy");

-- CreateIndex
CREATE INDEX "StockRequest_approvedBy_idx" ON "StockRequest"("approvedBy");

-- CreateIndex
CREATE INDEX "StockRequestItem_stockRequestId_idx" ON "StockRequestItem"("stockRequestId");

-- CreateIndex
CREATE INDEX "StockRequestItem_ingredientId_idx" ON "StockRequestItem"("ingredientId");

-- CreateIndex
CREATE INDEX "StockTransfer_stockRequestId_idx" ON "StockTransfer"("stockRequestId");

-- CreateIndex
CREATE INDEX "StockTransfer_fromWarehouseId_idx" ON "StockTransfer"("fromWarehouseId");

-- CreateIndex
CREATE INDEX "StockTransfer_toRestaurantId_idx" ON "StockTransfer"("toRestaurantId");

-- CreateIndex
CREATE INDEX "StockTransfer_status_idx" ON "StockTransfer"("status");

-- CreateIndex
CREATE INDEX "StockTransferItem_transferId_idx" ON "StockTransferItem"("transferId");

-- CreateIndex
CREATE INDEX "StockTransferItem_ingredientId_idx" ON "StockTransferItem"("ingredientId");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_transferId_key" ON "Shipment"("transferId");

-- CreateIndex
CREATE INDEX "Shipment_trackingNumber_idx" ON "Shipment"("trackingNumber");

-- CreateIndex
CREATE INDEX "Shipment_vehicleNumber_idx" ON "Shipment"("vehicleNumber");

-- CreateIndex
CREATE INDEX "Shipment_dispatchedAt_idx" ON "Shipment"("dispatchedAt");

-- CreateIndex
CREATE INDEX "InventoryTransit_transferId_idx" ON "InventoryTransit"("transferId");

-- CreateIndex
CREATE INDEX "InventoryTransit_ingredientId_idx" ON "InventoryTransit"("ingredientId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryTransit_transferId_ingredientId_key" ON "InventoryTransit"("transferId", "ingredientId");

-- CreateIndex
CREATE INDEX "TransferDiscrepancy_transferId_idx" ON "TransferDiscrepancy"("transferId");

-- CreateIndex
CREATE INDEX "TransferDiscrepancy_transferItemId_idx" ON "TransferDiscrepancy"("transferItemId");

-- CreateIndex
CREATE INDEX "TransferDiscrepancy_type_idx" ON "TransferDiscrepancy"("type");

-- CreateIndex
CREATE INDEX "WasteLog_restaurantId_idx" ON "WasteLog"("restaurantId");

-- CreateIndex
CREATE INDEX "WasteLog_ingredientId_idx" ON "WasteLog"("ingredientId");

-- CreateIndex
CREATE INDEX "WasteLog_createdAt_idx" ON "WasteLog"("createdAt");

-- AddForeignKey
ALTER TABLE "StockRequestItem" ADD CONSTRAINT "StockRequestItem_stockRequestId_fkey" FOREIGN KEY ("stockRequestId") REFERENCES "StockRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_stockRequestId_fkey" FOREIGN KEY ("stockRequestId") REFERENCES "StockRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransferItem" ADD CONSTRAINT "StockTransferItem_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "StockTransfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "StockTransfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferDiscrepancy" ADD CONSTRAINT "TransferDiscrepancy_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "StockTransfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferDiscrepancy" ADD CONSTRAINT "TransferDiscrepancy_transferItemId_fkey" FOREIGN KEY ("transferItemId") REFERENCES "StockTransferItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
