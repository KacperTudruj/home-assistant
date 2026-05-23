-- AlterTable
ALTER TABLE "Car" ADD COLUMN     "oilChangeIntervalKm" INTEGER;

-- AlterTable
ALTER TABLE "CarServiceRecord" ADD COLUMN     "isOilChange" BOOLEAN NOT NULL DEFAULT false;
