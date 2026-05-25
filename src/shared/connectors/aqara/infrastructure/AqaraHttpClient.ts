import axios, { AxiosInstance } from "axios";
import { AqaraClient, AqaraConfigRepository, AqaraDevice, AqaraResource } from "../domain/AqaraClient";
import * as crypto from "crypto";

export class AqaraHttpClient implements AqaraClient {
    private readonly baseUrls = {
        cn: "https://open-cn.aqara.com",
        us: "https://open-usa.aqara.com",
        kr: "https://open-kr.aqara.com",
        ru: "https://open-ru.aqara.com",
        eu: "https://open-ger.aqara.com",
        sg: "https://open-sg.aqara.com",
    };

    constructor(private readonly configRepository: AqaraConfigRepository) {}

    private async getAxiosInstance(): Promise<AxiosInstance> {
        const config = await this.configRepository.getAqaraConfig();
        if (!config) {
            throw new Error("Aqara configuration not found");
        }

        const baseUrl = this.baseUrls[config.region];
        
        const instance = axios.create({
            baseURL: baseUrl,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Interceptor do dodawania sygnatury i tokenu do każdego zapytania
        instance.interceptors.request.use(async (axiosConfig) => {
            const now = Date.now();
            const nonce = crypto.randomBytes(16).toString('hex');
            
            let accessToken = config.accessToken;
            
            // Logika wyliczania sygnatury Aqara (uproszczona na potrzeby szkieletu)
            // Wymaga dokładnej implementacji wg dokumentacji Aqara Open API
            const signature = this.generateSignature(config, now, nonce, accessToken);

            axiosConfig.headers['Appid'] = config.appId;
            axiosConfig.headers['Keyid'] = config.keyId;
            axiosConfig.headers['Nonce'] = nonce;
            axiosConfig.headers['Time'] = now.toString();
            axiosConfig.headers['Signature'] = signature;
            if (accessToken) {
                axiosConfig.headers['Accesstoken'] = accessToken;
            }

            return axiosConfig;
        });

        return instance;
    }

    private generateSignature(config: any, time: number, nonce: string, accessToken?: string): string {
        // Implementacja sygnatury Aqara:
        // sign = md5(lowercase(Appid=...&Nonce=...&Time=...[&Accesstoken=...] + AppKey))
        let str = `Appid=${config.appId}&Nonce=${nonce}&Time=${time}`;
        if (accessToken) {
            str += `&Accesstoken=${accessToken}`;
        }
        str += config.appKey;
        
        return crypto.createHash('md5').update(str.toLowerCase()).digest('hex');
    }

    async getDevices(): Promise<AqaraDevice[]> {
        const axiosInstance = await this.getAxiosInstance();
        // Aqara API: query.device.info
        const response = await axiosInstance.post("/v3.0/open/api", {
            intent: "query.device.info",
            data: {}
        });

        if (response.data.code !== 0) {
            throw new Error(`Aqara API error: ${response.data.message}`);
        }

        return response.data.result.data.map((item: any) => ({
            id: item.did,
            name: item.deviceName,
            model: item.model,
            type: item.deviceType,
            parentDid: item.parentDid
        }));
    }

    async getResourceValue(deviceId: string, resourceId: string): Promise<AqaraResource> {
        const results = await this.getResourcesValues(deviceId, [resourceId]);
        if (results.length === 0) {
            throw new Error(`Resource ${resourceId} not found for device ${deviceId}`);
        }
        return results[0];
    }

    async getResourcesValues(deviceId: string, resourceIds: string[]): Promise<AqaraResource[]> {
        const axiosInstance = await this.getAxiosInstance();
        // Aqara API: query.resource.value
        const response = await axiosInstance.post("/v3.0/open/api", {
            intent: "query.resource.value",
            data: {
                resources: [{
                    did: deviceId,
                    resourceIds: resourceIds
                }]
            }
        });

        if (response.data.code !== 0) {
            throw new Error(`Aqara API error: ${response.data.message}`);
        }

        return response.data.result.map((res: any) => ({
            resourceId: res.resourceId,
            value: res.value,
            timeStamp: res.timeStamp
        }));
    }
}
