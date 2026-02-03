-- Change mileageAtRefuelKm from INT to DOUBLE PRECISION to allow decimal odometer values
ALTER TABLE "CarFuelRecord"
  ALTER COLUMN "mileageAtRefuelKm" TYPE DOUBLE PRECISION USING "mileageAtRefuelKm"::double precision;