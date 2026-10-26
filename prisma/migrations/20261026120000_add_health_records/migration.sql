CREATE TABLE "HealthProfile" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "goalKg" DOUBLE PRECISION,
    "pathId" VARCHAR(64) NOT NULL DEFAULT 'frodo',
    CONSTRAINT "HealthProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HealthWeightRecord" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "kg" DOUBLE PRECISION NOT NULL,
    "note" VARCHAR(300),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HealthWeightRecord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HealthWeightRecord_date_key" ON "HealthWeightRecord"("date");

CREATE TABLE "HealthDistanceRecord" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "km" DOUBLE PRECISION NOT NULL,
    "note" VARCHAR(300),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HealthDistanceRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HealthDistanceRecord_date_idx" ON "HealthDistanceRecord"("date");
