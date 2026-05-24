import { SmartHomeDevice, SmartHomeProvider } from "./SmartHomeDevice";

export class CompositeSmartHomeProvider implements SmartHomeProvider {
    constructor(private readonly providers: SmartHomeProvider[]) {}

    async getDevices(): Promise<SmartHomeDevice[]> {
        const allDevices: SmartHomeDevice[] = [];
        for (const provider of this.providers) {
            try {
                const devices = await provider.getDevices();
                allDevices.push(...devices);
            } catch (error) {
                console.error('Error getting devices from provider:', error);
            }
        }
        return allDevices;
    }
}
