BEGIN;

--------------------------------------------------
-- 1. USUWAMY STARE FK (TYLKO NA CZAS MIGRACJI)
--------------------------------------------------

ALTER TABLE "Commentary"
DROP CONSTRAINT IF EXISTS "Commentary_commentatorId_fkey";

ALTER TABLE "FuelRecord"
DROP CONSTRAINT IF EXISTS "FuelRecord_carId_fkey";

ALTER TABLE "MileageRecord"
DROP CONSTRAINT IF EXISTS "MileageRecord_carId_fkey";

ALTER TABLE "ServiceRecord"
DROP CONSTRAINT IF EXISTS "ServiceRecord_carId_fkey";

--------------------------------------------------
-- 2. RENAME TABEL (ZACHOWUJEMY DANE)
--------------------------------------------------

-- Commentator -> CommentaryCommentator
ALTER TABLE "Commentator"
    RENAME TO "CommentaryCommentator";

-- Fuel / Mileage / Service
ALTER TABLE "FuelRecord"
    RENAME TO "CarFuelRecord";

ALTER TABLE "MileageRecord"
    RENAME TO "CarMileageRecord";

ALTER TABLE "ServiceRecord"
    RENAME TO "CarServiceRecord";

--------------------------------------------------
-- 3. DOSTOSOWANIE STRUKTURY (NOWE KOLUMNY)
--------------------------------------------------

-- CommentaryCommentator
ALTER TABLE "CommentaryCommentator"
    ADD COLUMN IF NOT EXISTS "enabled" BOOLEAN NOT NULL DEFAULT true;

--------------------------------------------------
-- 4. INDEKSY (IDEMPOTENTNIE)
--------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS "CommentaryCommentator_key_key"
    ON "CommentaryCommentator"("key");

CREATE INDEX IF NOT EXISTS "CarFuelRecord_carId_date_idx"
    ON "CarFuelRecord"("carId", "date");

CREATE INDEX IF NOT EXISTS "CarFuelRecord_fuelType_date_idx"
    ON "CarFuelRecord"("fuelType", "date");

CREATE INDEX IF NOT EXISTS "CarServiceRecord_carId_date_idx"
    ON "CarServiceRecord"("carId", "date");

--------------------------------------------------
-- 5. ODTWARZAMY FOREIGN KEY (JUŻ NA NOWE TABELKI)
--------------------------------------------------

ALTER TABLE "Commentary"
    ADD CONSTRAINT "Commentary_commentatorId_fkey"
        FOREIGN KEY ("commentatorId")
            REFERENCES "CommentaryCommentator"("id")
            ON DELETE RESTRICT
            ON UPDATE CASCADE;

ALTER TABLE "CarMileageRecord"
    ADD CONSTRAINT "CarMileageRecord_carId_fkey"
        FOREIGN KEY ("carId")
            REFERENCES "Car"("id")
            ON DELETE CASCADE
            ON UPDATE CASCADE;

ALTER TABLE "CarFuelRecord"
    ADD CONSTRAINT "CarFuelRecord_carId_fkey"
        FOREIGN KEY ("carId")
            REFERENCES "Car"("id")
            ON DELETE CASCADE
            ON UPDATE CASCADE;

ALTER TABLE "CarServiceRecord"
    ADD CONSTRAINT "CarServiceRecord_carId_fkey"
        FOREIGN KEY ("carId")
            REFERENCES "Car"("id")
            ON DELETE CASCADE
            ON UPDATE CASCADE;

COMMIT;
