ALTER TABLE "PayrollRun"
  ADD COLUMN "paidAt" TIMESTAMP(3),
  ADD COLUMN "paidById" TEXT,
  ADD COLUMN "paymentReference" TEXT,
  ADD COLUMN "reopenedAt" TIMESTAMP(3),
  ADD COLUMN "reopenedById" TEXT,
  ADD COLUMN "reopenReason" TEXT;

ALTER TABLE "Shift" ADD COLUMN "payrollRunId" TEXT;
CREATE INDEX "Shift_payrollRunId_idx" ON "Shift"("payrollRunId");
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_payrollRunId_fkey"
  FOREIGN KEY ("payrollRunId") REFERENCES "PayrollRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
