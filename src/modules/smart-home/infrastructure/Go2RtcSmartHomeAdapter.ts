import { SmartHomeDevice, SmartHomeProvider } from "../domain/SmartHomeDevice";

export class Go2RtcSmartHomeAdapter implements SmartHomeProvider {
    async getDevices(): Promise<SmartHomeDevice[]> {
        // Zwracamy kamerę z salonu, która jest skonfigurowana w go2rtc
        return [
            {
                id: 'kamera_salon',
                name: 'Kamera Salon',
                type: 'CAMERA'
            }
        ];
    }
}
