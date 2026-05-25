-- AlterTable
ALTER TABLE "SystemConfigurationSmartAgd" ADD COLUMN     "mqtt_broker_url" TEXT,
ADD COLUMN     "mqtt_password" TEXT,
ADD COLUMN     "mqtt_topic_prefix" TEXT DEFAULT 'zigbee2mqtt',
ADD COLUMN     "mqtt_username" TEXT;
