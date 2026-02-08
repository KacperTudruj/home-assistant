-- CreateTable
CREATE TABLE "SystemConfigurationSmartAgd" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "samsung_smart_things_token" TEXT,

    CONSTRAINT "SystemConfigurationSmartAgd_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SystemConfigurationSmartAgd_key_key" ON "SystemConfigurationSmartAgd"("key");
