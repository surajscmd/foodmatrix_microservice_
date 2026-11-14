ALTER TABLE "order_items"
  ADD COLUMN "unavailable_reason" VARCHAR(500),
  ADD COLUMN "unavailable_requested_at" TIMESTAMPTZ(3),
  ADD COLUMN "unavailable_resolved_at" TIMESTAMPTZ(3);
