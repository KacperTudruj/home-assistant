import * as mqtt from "mqtt";
import { MqttClient, MqttConfigRepository, MqttMessageHandler, MqttMessage } from "../domain/MqttClient";

export class MqttJsClient implements MqttClient {
    private client: mqtt.MqttClient | null = null;
    private readonly messageCache: Map<string, MqttMessage> = new Map();
    private readonly handlers: Map<string, MqttMessageHandler[]> = new Map();

    constructor(private readonly configRepository: MqttConfigRepository) {}

    private async getClient(): Promise<mqtt.MqttClient> {
        if (this.client) {
            return this.client;
        }

        const config = await this.configRepository.getMqttConfig();
        if (!config) {
            throw new Error("MQTT configuration not found");
        }

        this.client = mqtt.connect(config.brokerUrl, {
            username: config.username,
            password: config.password,
        });

        this.client.on("message", (topic: string, payload: Buffer) => {
            const message: MqttMessage = { topic, payload };
            this.messageCache.set(topic, message);

            // Powiadom bezpośrednie handlery
            const topicHandlers = this.handlers.get(topic);
            if (topicHandlers) {
                topicHandlers.forEach(handler => handler(message));
            }
            
            // Powiadom handlery z wildcardami (prosta implementacja dla +)
            this.handlers.forEach((handlers, registeredTopic) => {
                if (registeredTopic.includes('+')) {
                    const regex = new RegExp('^' + registeredTopic.replace(/\+/g, '[^/]+') + '$');
                    if (regex.test(topic)) {
                        handlers.forEach(handler => handler(message));
                    }
                } else if (registeredTopic.includes('#')) {
                    const regex = new RegExp('^' + registeredTopic.replace(/#/g, '.*') + '$');
                    if (regex.test(topic)) {
                        handlers.forEach(handler => handler(message));
                    }
                }
            });
        });

        return new Promise((resolve, reject) => {
            this.client!.on("connect", () => {
                console.log("Connected to MQTT broker");
                resolve(this.client!);
            });
            this.client!.on("error", (err: Error) => {
                reject(err);
            });
        });
    }

    async subscribe(topic: string, handler: MqttMessageHandler): Promise<void> {
        const client = await this.getClient();
        
        if (!this.handlers.has(topic)) {
            this.handlers.set(topic, []);
            await client.subscribeAsync(topic);
        }
        
        this.handlers.get(topic)!.push(handler);
        
        // Jeśli mamy już coś w cache, wywołaj handler od razu (opcjonalne, zależnie od potrzeb)
        const cached = this.messageCache.get(topic);
        if (cached) {
            handler(cached);
        }
    }

    async publish(topic: string, payload: string | Buffer): Promise<void> {
        const client = await this.getClient();
        await client.publishAsync(topic, payload);
    }

    getLatestMessage(topic: string): MqttMessage | null {
        return this.messageCache.get(topic) || null;
    }
}
