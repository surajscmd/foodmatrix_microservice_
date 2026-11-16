CREATE TABLE "InventoryOutbox" (
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventoryOutbox_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "InventoryOutbox_createdAt_idx" ON "InventoryOutbox"("createdAt");

CREATE TABLE "InventoryPendingDeduction" (
    "orderItemId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "retryAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT NOT NULL,
    CONSTRAINT "InventoryPendingDeduction_pkey" PRIMARY KEY ("orderItemId")
);
CREATE INDEX "InventoryPendingDeduction_retryAt_idx" ON "InventoryPendingDeduction"("retryAt");
