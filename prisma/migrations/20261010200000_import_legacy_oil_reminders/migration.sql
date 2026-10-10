BEGIN;

-- Snapshot the old settings once. Application writes cannot change the source mid-import.
LOCK TABLE "Car", "CarServiceRecord", "Reminder" IN SHARE ROW EXCLUSIVE MODE;

CREATE TABLE "LegacyOilReminderImport" (
    "carId" TEXT NOT NULL PRIMARY KEY,
    "carName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "serviceRecordId" TEXT,
    "reminderId" TEXT,
    "dueMileageKm" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "LegacyOilReminderImport"
    ("carId", "carName", "status", "note", "serviceRecordId", "reminderId", "dueMileageKm")
SELECT c."id", c."name",
    CASE
        WHEN c."oilChangeIntervalKm" <= 0 THEN 'INVALID_INTERVAL'
        WHEN s."id" IS NULL THEN 'MISSING_SERVICE'
        WHEN s."mileageKm" < 0 OR s."mileageKm"::BIGINT + c."oilChangeIntervalKm" > 2147483647 THEN 'INVALID_TARGET'
        WHEN EXISTS (SELECT 1 FROM "Reminder" r WHERE r."moduleKey" = 'car' AND r."resourceId" = c."id" AND r."kind" = 'MILEAGE' AND r."lifecycle" = 'ACTIVE') THEN 'EXISTING_REMINDER'
        ELSE 'IMPORTED'
    END,
    CASE
        WHEN c."oilChangeIntervalKm" <= 0 THEN 'Invalid old interval; set the reminder manually.'
        WHEN s."id" IS NULL THEN 'No recorded oil change; set the baseline manually.'
        WHEN s."mileageKm" < 0 OR s."mileageKm"::BIGINT + c."oilChangeIntervalKm" > 2147483647 THEN 'Invalid target mileage; set the reminder manually.'
        WHEN EXISTS (SELECT 1 FROM "Reminder" r WHERE r."moduleKey" = 'car' AND r."resourceId" = c."id" AND r."kind" = 'MILEAGE' AND r."lifecycle" = 'ACTIVE') THEN 'Active mileage reminder already exists; review manually, no overwrite.'
        WHEN EXISTS (SELECT 1 FROM "CarServiceRecord" newer WHERE newer."carId" = c."id" AND newer."isOilChange" AND newer."date" > s."date") THEN 'Imported from highest mileage; a later dated oil change has lower mileage. Review target.'
        WHEN NOT c."isActive" THEN 'Imported as archived because the car is inactive.'
        ELSE 'Imported from highest recorded oil change mileage.'
    END,
    s."id", NULL,
    CASE WHEN c."oilChangeIntervalKm" > 0 AND s."mileageKm" >= 0
        AND s."mileageKm"::BIGINT + c."oilChangeIntervalKm" <= 2147483647
        THEN s."mileageKm" + c."oilChangeIntervalKm" ELSE NULL END
FROM "Car" c
LEFT JOIN LATERAL (
    SELECT * FROM "CarServiceRecord" s
    WHERE s."carId" = c."id" AND s."isOilChange"
    ORDER BY s."mileageKm" DESC, s."date" DESC, s."id" ASC LIMIT 1
) s ON TRUE
WHERE c."oilChangeIntervalKm" IS NOT NULL;

-- Deterministic ID keeps the origin durable even after the reminder is edited/archived.
INSERT INTO "Reminder" ("id", "title", "moduleKey", "resourceId", "additionalInfo", "kind",
    "dueMileageKm", "lifecycle", "createdAt", "updatedAt")
SELECT 'legacy-oil:' || i."carId", 'Wymiana oleju', 'car', i."carId",
    'Przeniesiono ze starego licznika. Ostatnia wymiana: ' || s."mileageKm" || ' km. ' || i."note",
    'MILEAGE'::"ReminderKind", i."dueMileageKm",
    CASE WHEN c."isActive" THEN 'ACTIVE'::"ReminderLifecycle" ELSE 'ARCHIVED'::"ReminderLifecycle" END,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "LegacyOilReminderImport" i
JOIN "Car" c ON c."id" = i."carId"
JOIN "CarServiceRecord" s ON s."id" = i."serviceRecordId"
WHERE i."status" = 'IMPORTED';

UPDATE "LegacyOilReminderImport" SET "reminderId" = 'legacy-oil:' || "carId" WHERE "status" = 'IMPORTED';

COMMIT;
