CREATE TABLE "NotificationSocketOutbox" (
    "notificationId" TEXT NOT NULL,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotificationSocketOutbox_pkey" PRIMARY KEY ("notificationId")
);

CREATE INDEX "NotificationSocketOutbox_availableAt_createdAt_idx"
    ON "NotificationSocketOutbox"("availableAt", "createdAt");

ALTER TABLE "NotificationSocketOutbox"
    ADD CONSTRAINT "NotificationSocketOutbox_notificationId_fkey"
    FOREIGN KEY ("notificationId") REFERENCES "Notification"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
