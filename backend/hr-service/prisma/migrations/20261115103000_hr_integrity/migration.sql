BEGIN;

ALTER TABLE "Staff" ADD COLUMN "terminatedAt" TIMESTAMP(3);
UPDATE "Staff" SET "terminatedAt" = COALESCE("deletedAt", "updatedAt")
WHERE "status" = 'TERMINATED';

CREATE TABLE "StaffAssignment" (
  "id" TEXT PRIMARY KEY,
  "staffId" TEXT NOT NULL REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "restaurantId" TEXT NOT NULL,
  "startsOn" DATE NOT NULL,
  "endsBefore" DATE,
  CONSTRAINT "StaffAssignment_dates_check" CHECK ("endsBefore" IS NULL OR "endsBefore" >= "startsOn")
);
CREATE INDEX "StaffAssignment_staffId_startsOn_idx" ON "StaffAssignment"("staffId", "startsOn");
CREATE INDEX "StaffAssignment_restaurantId_startsOn_idx" ON "StaffAssignment"("restaurantId", "startsOn");
CREATE UNIQUE INDEX "StaffAssignment_one_current" ON "StaffAssignment"("staffId") WHERE "endsBefore" IS NULL;
INSERT INTO "StaffAssignment" ("id", "staffId", "restaurantId", "startsOn")
SELECT gen_random_uuid()::text, "id", "restaurantId",
  COALESCE((SELECT MIN(w."effectiveStartDate") FROM "WageHistory" w
    WHERE w."staffId" = s."id" AND w."effectiveStartDate" BETWEEN s."createdAt"::date - 1 AND s."createdAt"::date + 1), s."createdAt"::date)
FROM "Staff" s;

ALTER TABLE "Shift" ADD COLUMN "voidedAt" TIMESTAMP(3), ADD COLUMN "shiftScheduleId" TEXT;
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_shiftScheduleId_fkey"
  FOREIGN KEY ("shiftScheduleId") REFERENCES "ShiftSchedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE UNIQUE INDEX "Shift_shiftScheduleId_key" ON "Shift"("shiftScheduleId");

-- Keep duplicate legacy rows for audit. Only the first still-open punch counts.
WITH duplicates AS (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "staffId" ORDER BY "clockInAt", "id") AS rank
  FROM "Shift" WHERE "clockOutAt" IS NULL
)
UPDATE "Shift" SET "voidedAt" = CURRENT_TIMESTAMP
FROM duplicates WHERE "Shift"."id" = duplicates."id" AND duplicates.rank > 1;
CREATE UNIQUE INDEX "Shift_one_open_per_staff"
  ON "Shift"("staffId") WHERE "clockOutAt" IS NULL AND "voidedAt" IS NULL;

ALTER TABLE "Leave" ADD COLUMN "restaurantId" TEXT;
UPDATE "Leave" l SET "restaurantId" = s."restaurantId" FROM "Staff" s WHERE s."id" = l."staffId";
ALTER TABLE "Leave" ALTER COLUMN "restaurantId" SET NOT NULL;
CREATE INDEX "Leave_restaurantId_idx" ON "Leave"("restaurantId");

ALTER TABLE "PayrollRun"
  ADD COLUMN "restaurantName" TEXT,
  ADD COLUMN "timezone" TEXT,
  ADD COLUMN "currency" TEXT;

CREATE TABLE "HrEventOutbox" (
  "id" TEXT PRIMARY KEY,
  "topic" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "HrEventOutbox_availableAt_createdAt_idx" ON "HrEventOutbox"("availableAt", "createdAt");

COMMIT;
