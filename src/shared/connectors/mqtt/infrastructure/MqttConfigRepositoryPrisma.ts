import { PrismaClient } from "@prisma/client";
import { MqttConfig, MqttConfigRepository } from "../domain/MqttClient";

export class MqttConfigRepositoryPrisma implements MqttConfigRepository {
    constructor(private readonly prisma: PrismaClient) {}

    async getMqttConfig(): Promise<MqttConfig | null> {
        const config = await this.prisma.systemConfigurationSmartAgd.findFirst({
            where: { key: "MQTT_CONFIG" }
        });

        if (!config || !config.mqttBrokerUrl) {
            return null;
        }

        return {
            brokerUrl: config.mqttBrokerUrl,
            username: config.mqttUsername || undefined,
            password: config.mqttPassword || undefined,
            topicPrefix: config.mqttTopicPrefix || 'zigbee2mqtt'
        };
    }
}
