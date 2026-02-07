import { Device } from "./Device";

export interface SmartThingsClient {
    getDevices(): Promise<Device[]>;
}

export interface SmartThingsConfigRepository {
    getSmartThingsToken(): Promise<string | null>;
}
