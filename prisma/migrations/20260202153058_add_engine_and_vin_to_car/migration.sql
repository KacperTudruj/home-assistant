-- AlterTable
ALTER TABLE "Car" ADD COLUMN     "engine" TEXT,
ADD COLUMN     "vin" TEXT;

-- AlterTable
ALTER TABLE "CarFuelRecord" RENAME CONSTRAINT "FuelRecord_pkey" TO "CarFuelRecord_pkey";

-- AlterTable
ALTER TABLE "CarMileageRecord" RENAME CONSTRAINT "MileageRecord_pkey" TO "CarMileageRecord_pkey";

-- AlterTable
ALTER TABLE "CarServiceRecord" RENAME CONSTRAINT "ServiceRecord_pkey" TO "CarServiceRecord_pkey";

-- AlterTable
ALTER TABLE "CommentaryCommentator" RENAME CONSTRAINT "Commentator_pkey" TO "CommentaryCommentator_pkey";
