-- Update driving mode from Mixed to City
UPDATE "CarFuelRecord" SET "drivingMode" = 'CITY' WHERE "drivingMode" = 'MIXED';
