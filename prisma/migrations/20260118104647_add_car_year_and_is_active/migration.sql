/*
  Migration: add_car_year_and_is_active
*/

-- 1. Dodajemy kolumny (bez NOT NULL dla year)
ALTER TABLE "Car"
ADD COLUMN "year" INTEGER,
ADD COLUMN "isActive" BOOLEAN DEFAULT true;

-- 2. Uzupełniamy dane historyczne
UPDATE "Car"
SET "year" = EXTRACT(YEAR FROM "createdAt");

-- 3. Wymuszamy NOT NULL
ALTER TABLE "Car"
ALTER COLUMN "year" SET NOT NULL;

ALTER TABLE "Car"
ALTER COLUMN "isActive" SET NOT NULL;
