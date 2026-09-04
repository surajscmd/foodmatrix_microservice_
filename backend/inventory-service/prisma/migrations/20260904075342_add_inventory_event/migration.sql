-- CreateTable
CREATE TABLE "InventoryEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InventoryEvent_eventId_key" ON "InventoryEvent"("eventId");

-- CreateIndex
CREATE INDEX "InventoryEvent_eventType_idx" ON "InventoryEvent"("eventType");

-- CreateIndex
CREATE INDEX "InventoryEvent_referenceId_idx" ON "InventoryEvent"("referenceId");
