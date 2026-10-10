CREATE TYPE "ReminderKind" AS ENUM ('DATE', 'MILEAGE');
CREATE TYPE "ReminderLifecycle" AS ENUM ('ACTIVE', 'COMPLETED', 'ARCHIVED');

CREATE TABLE "Reminder" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "moduleKey" VARCHAR(64) NOT NULL,
    "resourceId" VARCHAR(200),
    "additionalInfo" VARCHAR(5000),
    "kind" "ReminderKind" NOT NULL,
    "dueDate" DATE,
    "dueMileageKm" INTEGER,
    "lifecycle" "ReminderLifecycle" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Reminder_moduleKey_resourceId_lifecycle_idx"
ON "Reminder"("moduleKey", "resourceId", "lifecycle");
