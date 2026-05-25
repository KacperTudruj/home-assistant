export interface MqttMessage {
    topic: string;
    payload: Buffer;
}

export type MqttMessageHandler = (message: MqttMessage) => void;

export interface MqttClient {
    subscribe(topic: string, handler: MqttMessageHandler): Promise<void>;
    publish(topic: string, payload: string | Buffer): Promise<void>;
    getLatestMessage(topic: string): MqttMessage | null;
}

export interface MqttConfig {
    brokerUrl: string;
    username?: string;
    password?: string;
    topicPrefix: string;
}

export interface MqttConfigRepository {
    getMqttConfig(): Promise<MqttConfig | null>;
}
