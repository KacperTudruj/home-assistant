// import mqtt from "mqtt";
// import type { MqttClient as IMqttClient } from "mqtt";
import { MqttClient, MqttConfigRepository, MqttMessageHandler, MqttMessage } from "../domain/MqttClient";

/**
 * MQTT client implementation - TEMPORARILY DISABLED due to missing dependencies in some environments.
 */
export class MqttJsClient implements MqttClient {
    constructor(private readonly configRepository: MqttConfigRepository) {
        console.warn("MqttJsClient is currently disabled (commented out code).");
    }

    async subscribe(topic: string, handler: MqttMessageHandler): Promise<void> {
        // Disabled
    }

    async publish(topic: string, payload: string | Buffer): Promise<void> {
        // Disabled
    }

    getLatestMessage(topic: string): MqttMessage | null {
        return null;
    }
}
