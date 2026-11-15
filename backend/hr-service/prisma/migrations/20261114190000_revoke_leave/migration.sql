ALTER TYPE "LeaveStatus" ADD VALUE 'REVOKED';

ALTER TABLE "Leave"
  ADD COLUMN "revokedById" TEXT,
  ADD COLUMN "revokedAt" TIMESTAMP(3),
  ADD COLUMN "revokeReason" TEXT;
