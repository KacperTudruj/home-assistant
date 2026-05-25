import { SmartHomeDevice, SmartHomeProvider } from './SmartHomeDevice';

export class CompositeSmartHomeProvider implements SmartHomeProvider {
    constructor(private readonly providers: SmartHomeProvider[]) {}

    async getDevices(): Promise<SmartHomeDevice[]> {
        const allDevices = await Promise.all(
            this.providers.map(p => p.getDevices())
        );
        return allDevices.flat();
    }

    async updateCameraLabel(id: string, label: string): Promise<void> {
        for (const provider of this.providers) {
            if (provider.updateCameraLabel) {
                try {
                    await provider.updateCameraLabel(id, label);
                } catch (e) {
                    // Ignorujemy błędy, jeśli dany provider nie posiada tego urządzenia
                }
            }
        }
    }
}
