-- Add mileageAtPurchase column to Car table
-- Nullable integer with default 0 to backfill existing rows
ALTER TABLE "Car"
ADD COLUMN IF NOT EXISTS "mileageAtPurchase" INTEGER DEFAULT 0;