-- CreateEnum
CREATE TYPE "DrivingMode" AS ENUM ('MIXED', 'CITY', 'HIGHWAY');

-- AlterTable
ALTER TABLE "CarFuelRecord" ADD COLUMN     "drivingMode" "DrivingMode" NOT NULL DEFAULT 'MIXED';
