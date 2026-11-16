CREATE TABLE "order_create_requests" (
    "key" VARCHAR(255) NOT NULL,
    "fingerprint" CHAR(64) NOT NULL,
    "order_id" UUID NOT NULL,
    CONSTRAINT "order_create_requests_pkey" PRIMARY KEY ("key"),
    CONSTRAINT "order_create_requests_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "order_create_requests_order_id_idx" ON "order_create_requests"("order_id");

CREATE TABLE "order_inventory_events" (
    "order_item_id" UUID NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "order_inventory_events_pkey" PRIMARY KEY ("order_item_id")
);

CREATE INDEX "order_inventory_events_created_at_idx" ON "order_inventory_events"("created_at");
