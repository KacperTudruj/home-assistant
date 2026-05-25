import { SmartHomeDevice, SmartHomeProvider, SmartHomeDeviceType, SensorDevice } from "../domain/SmartHomeDevice";
import { MqttClient } from "../../../shared/connectors/mqtt/domain/MqttClient";

export class ZigbeeMqttSmartHomeAdapter implements SmartHomeProvider {
    private devices: any[] = [];
    private readonly topicPrefix: string = 'zigbee2mqtt';

    constructor(private readonly mqttClient: MqttClient) {
        this.init();
    }

    private async init() {
        await this.mqttClient.subscribe(`${this.topicPrefix}/bridge/devices`, (msg) => {
            try {
                this.devices = JSON.parse(msg.payload.toString());
            } catch (e) {
                console.error("Failed to parse Zigbee2MQTT devices", e);
            }
        });

        // Subskrybuj wszystkie wiadomości od urządzeń, aby wypełnić cache stanami
        await this.mqttClient.subscribe(`${this.topicPrefix}/+`, () => {});
    }

    async getDevices(): Promise<SmartHomeDevice[]> {
        const results: SmartHomeDevice[] = [];

        for (const device of this.devices) {
            if (device.type === 'Coordinator') continue;
            
            const friendlyName = device.friendly_name;
            const stateMsg = this.mqttClient.getLatestMessage(`${this.topicPrefix}/${friendlyName}`);
            
            if (!stateMsg) continue;

            let state: any = {};
            try {
                state = JSON.parse(stateMsg.payload.toString());
            } catch (e) {
                continue;
            }

            // Mapowanie sensorów podobnie jak w AqaraSmartHomeAdapter
            if (state.temperature !== undefined) {
                results.push({
                    id: `z2m_${device.ieee_address}_temp`,
                    name: `${friendlyName} Temperature`,
                    label: `${friendlyName} Temperatura`,
                    type: SmartHomeDeviceType.SENSOR,
                    value: state.temperature,
                    unit: '°C'
                } as SensorDevice);
            }

            if (state.humidity !== undefined) {
                results.push({
                    id: `z2m_${device.ieee_address}_hum`,
                    name: `${friendlyName} Humidity`,
                    label: `${friendlyName} Wilgotność`,
                    type: SmartHomeDeviceType.SENSOR,
                    value: state.humidity,
                    unit: '%'
                } as SensorDevice);
            }

            if (state.pressure !== undefined) {
                results.push({
                    id: `z2m_${device.ieee_address}_pres`,
                    name: `${friendlyName} Pressure`,
                    label: `${friendlyName} Ciśnienie`,
                    type: SmartHomeDeviceType.SENSOR,
                    value: state.pressure,
                    unit: 'hPa'
                } as SensorDevice);
            }

            if (state.smoke !== undefined) {
                results.push({
                    id: `z2m_${device.ieee_address}_smoke`,
                    name: `${friendlyName} Smoke Status`,
                    label: `${friendlyName} Status Dymu`,
                    type: SmartHomeDeviceType.SENSOR,
                    value: state.smoke ? 'ALARM' : 'OK',
                    unit: ''
                } as SensorDevice);
            }
        }

        return results;
    }
}
