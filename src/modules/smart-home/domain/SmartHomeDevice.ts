export enum SmartHomeDeviceType {
    CAMERA = 'CAMERA',
    SENSOR = 'SENSOR',
    OTHER = 'OTHER'
}

export interface SmartHomeDevice {
    id: string;
    name: string;
    label: string;
    type: SmartHomeDeviceType;
}

export interface CameraDevice extends SmartHomeDevice {
    type: SmartHomeDeviceType.CAMERA;
    streamUrl: string;
}

export interface SensorDevice extends SmartHomeDevice {
    type: SmartHomeDeviceType.SENSOR;
    value: string | number;
    unit?: string;
}

export interface SmartHomeProvider {
    getDevices(): Promise<SmartHomeDevice[]>;
    updateCameraLabel?(id: string, label: string): Promise<void>;
}
