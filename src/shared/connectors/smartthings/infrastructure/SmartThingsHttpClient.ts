import axios, { AxiosInstance, AxiosError } from "axios";
import { Device } from "../domain/Device";
import { SmartThingsClient, SmartThingsConfigRepository } from "../domain/SmartThingsClient";

export class SmartThingsHttpClient implements SmartThingsClient {
    private readonly baseUrl = "https://api.smartthings.com/v1";

    constructor(
        private readonly configRepository: SmartThingsConfigRepository,
        private readonly onTokenExpired?: () => void
    ) {}

    private async getAxiosInstance(): Promise<AxiosInstance> {
        const token = await this.configRepository.getSmartThingsToken();
        
        const instance = axios.create({
            baseURL: this.baseUrl,
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        instance.interceptors.response.use(
            (response) => response,
            (error: AxiosError) => {
                if (error.response?.status === 401) {
                    console.error("SmartThings token expired or invalid.");
                    if (this.onTokenExpired) {
                        this.onTokenExpired();
                    }
                }
                return Promise.reject(error);
            }
        );

        return instance;
    }

    async getDevices(): Promise<Device[]> {
        const axiosInstance = await this.getAxiosInstance();
        const response = await axiosInstance.get("/devices");
        // SmartThings API zwraca listę urządzeń w polu 'items'
        return response.data.items.map((item: any) => ({
            id: item.deviceId,
            label: item.label,
            name: item.name,
            components: item.components?.map((comp: any) => ({
                id: comp.id,
                capabilities: comp.capabilities?.map((cap: any) => ({
                    id: cap.id,
                    version: cap.version,
                })),
            })),
        }));
    }
}
