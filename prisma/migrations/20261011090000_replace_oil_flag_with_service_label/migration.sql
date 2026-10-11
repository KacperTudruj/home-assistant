BEGIN;

CREATE TYPE "ServiceLabel" AS ENUM ('OIL_CHANGE', 'FILTERS', 'BATTERY', 'INSPECTION', 'REPAIR');
ALTER TABLE "CarServiceRecord" ADD COLUMN "label" "ServiceLabel";

-- Preserve historical oil changes as descriptive labels, independent of reminders.
UPDATE "CarServiceRecord" SET "label" = 'OIL_CHANGE' WHERE "isOilChange" = TRUE;

ALTER TABLE "CarServiceRecord" DROP COLUMN "isOilChange";
-- The preceding import migration has already created the reminders.
DROP TABLE "LegacyOilReminderImport";

COMMIT;
