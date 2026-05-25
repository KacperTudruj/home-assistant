import { SmartHomeDevice, SmartHomeProvider, SmartHomeDeviceType, SensorDevice } from "../domain/SmartHomeDevice";
import { AqaraClient } from "../../../shared/connectors/aqara/domain/AqaraClient";

export class AqaraSmartHomeAdapter implements SmartHomeProvider {
    private readonly RESOURCES = {
        TEMPERATURE: '0.1.85',
        HUMIDITY: '0.2.85',
        PRESSURE: '0.3.85',
        SMOKE: '13.1.85',
        SMOKE_STATUS: '13.1.111'
    };

    constructor(private readonly aqaraClient: AqaraClient) {}

    async getDevices(): Promise<SmartHomeDevice[]> {
        const aqaraDevices = await this.aqaraClient.getDevices();
        const results: SmartHomeDevice[] = [];

        for (const device of aqaraDevices) {
            // Obsługa czujnika temperatury, wilgotności i ciśnienia
            if (device.model === 'lumi.weather' || device.model.includes('sensor_ht')) {
                const resources = await this.aqaraClient.getResourcesValues(device.id, [
                    this.RESOURCES.TEMPERATURE,
                    this.RESOURCES.HUMIDITY,
                    this.RESOURCES.PRESSURE
                ]);

                resources.forEach(res => {
                    if (res.resourceId === this.RESOURCES.TEMPERATURE) {
                        results.push({
                            id: `${device.id}_temp`,
                            name: `${device.name} Temperature`,
                            label: `${device.name} Temperatura`,
                            type: SmartHomeDeviceType.SENSOR,
                            value: parseFloat(res.value) / 100, // Aqara podaje w setnych częściach stopnia
                            unit: '°C'
                        } as SensorDevice);
                    } else if (res.resourceId === this.RESOURCES.HUMIDITY) {
                        results.push({
                            id: `${device.id}_hum`,
                            name: `${device.name} Humidity`,
                            label: `${device.name} Wilgotność`,
                            type: SmartHomeDeviceType.SENSOR,
                            value: parseFloat(res.value) / 100, // Aqara podaje w setnych częściach %
                            unit: '%'
                        } as SensorDevice);
                    } else if (res.resourceId === this.RESOURCES.PRESSURE) {
                        results.push({
                            id: `${device.id}_pres`,
                            name: `${device.name} Pressure`,
                            label: `${device.name} Ciśnienie`,
                            type: SmartHomeDeviceType.SENSOR,
                            value: parseFloat(res.value) / 100, // Aqara podaje w Pa, chcemy hPa (dzielone przez 100) lub zależy od skali
                            unit: 'hPa'
                        } as SensorDevice);
                    }
                });
            }

            // Obsługa czujnika dymu
            if (device.model.includes('sensor_smoke')) {
                const resources = await this.aqaraClient.getResourcesValues(device.id, [
                    this.RESOURCES.SMOKE,
                    this.RESOURCES.SMOKE_STATUS
                ]);

                const statusRes = resources.find(r => r.resourceId === this.RESOURCES.SMOKE_STATUS);
                const densityRes = resources.find(r => r.resourceId === this.RESOURCES.SMOKE);

                results.push({
                    id: `${device.id}_smoke`,
                    name: `${device.name} Smoke Status`,
                    label: `${device.name} Status Dymu`,
                    type: SmartHomeDeviceType.SENSOR,
                    value: statusRes ? (statusRes.value === '1' ? 'ALARM' : 'OK') : 'UNKNOWN',
                    unit: ''
                } as SensorDevice);

                if (densityRes) {
                    results.push({
                        id: `${device.id}_smoke_density`,
                        name: `${device.name} Smoke Density`,
                        label: `${device.name} Gęstość Dymu`,
                        type: SmartHomeDeviceType.SENSOR,
                        value: parseFloat(densityRes.value),
                        unit: 'mg/m3'
                    } as SensorDevice);
                }
            }
        }

        return results;
    }
}
