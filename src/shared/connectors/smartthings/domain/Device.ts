export interface Device {
    id: string;
    label: string;
    name: string;
    components: DeviceComponent[];
}

export interface DeviceComponent {
    id: string;
    capabilities: Capability[];
}

export interface Capability {
    id: string;
    version: number;
}
