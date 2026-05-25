export interface AqaraDevice {
    id: string;
    name: string;
    model: string;
    type: string;
    parentDid?: string;
}

export interface AqaraResource {
    resourceId: string;
    value: string;
    timeStamp: number;
}

export interface AqaraClient {
    getDevices(): Promise<AqaraDevice[]>;
    getResourceValue(deviceId: string, resourceId: string): Promise<AqaraResource>;
    getResourcesValues(deviceId: string, resourceIds: string[]): Promise<AqaraResource[]>;
}

export interface AqaraConfigRepository {
    getAqaraConfig(): Promise<AqaraConfig | null>;
}

export interface AqaraConfig {
    appId: string;
    appKey: string;
    keyId: string;
    accessToken?: string;
    refreshToken?: string;
    region: 'cn' | 'us' | 'kr' | 'ru' | 'eu' | 'sg';
}
