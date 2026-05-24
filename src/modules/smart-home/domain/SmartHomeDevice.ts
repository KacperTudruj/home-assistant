export interface SmartHomeDevice {
    id: string;
    name: string;
    type: 'CAMERA' | 'SENSOR' | 'OTHER';
}

export interface CameraDevice extends SmartHomeDevice {
    type: 'CAMERA';
    streamUrl: string;
}

export interface SensorDevice extends SmartHomeDevice {
    type: 'SENSOR';
    value: string | number;
    unit?: string;
}

export interface SmartHomeProvider {
    getDevices(): Promise<SmartHomeDevice[]>;
}
