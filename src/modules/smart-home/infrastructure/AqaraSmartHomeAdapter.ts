import { SmartHomeDevice, SmartHomeProvider } from "../domain/SmartHomeDevice";
import { AqaraClient } from "../../../shared/connectors/aqara/domain/AqaraClient";

export class AqaraSmartHomeAdapter implements SmartHomeProvider {
    constructor(private readonly aqaraClient: AqaraClient) {}

    async getDevices(): Promise<SmartHomeDevice[]> {
        const aqaraDevices = await this.aqaraClient.getDevices();
        
        const devices: SmartHomeDevice[] = [];

        for (const d of aqaraDevices) {
            // Logika rozpoznawania urządzeń
            if (d.model.includes('camera') || d.model.includes('g2h')) {
                devices.push({
                    id: d.id,
                    name: d.name,
                    type: 'CAMERA'
                });
            } else if (d.model.includes('sensor') || d.model.includes('weather')) {
                // Dla uproszczenia pobierzmy od razu wartość jeśli to sensor
                // W rzeczywistym UseCase moglibyśmy to rozbić
                try {
                    const temp = await this.aqaraClient.getResourceValue(d.id, '0.1.85'); // Przykładowy resourceId dla temp
                    devices.push({
                        id: d.id,
                        name: d.name,
                        type: 'SENSOR',
                        value: temp.value,
                        unit: '°C'
                    } as any);
                } catch (e) {
                    devices.push({
                        id: d.id,
                        name: d.name,
                        type: 'SENSOR',
                        value: 'N/A'
                    } as any);
                }
            } else {
                devices.push({
                    id: d.id,
                    name: d.name,
                    type: 'OTHER'
                });
            }
        }

        return devices;
    }
}
