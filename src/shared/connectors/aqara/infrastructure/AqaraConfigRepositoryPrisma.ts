import { PrismaClient } from "@prisma/client";
import { AqaraConfig, AqaraConfigRepository } from "../domain/AqaraClient";

export class AqaraConfigRepositoryPrisma implements AqaraConfigRepository {
    constructor(private readonly prisma: PrismaClient) {}

    async getAqaraConfig(): Promise<AqaraConfig | null> {
        const config = await this.prisma.systemConfigurationSmartAgd.findFirst({
            where: { key: "AQARA_CONFIG" }
        });

        if (!config || !config.aqaraAppId || !config.aqaraAppKey || !config.aqaraKeyId) {
            return null;
        }

        return {
            appId: config.aqaraAppId,
            appKey: config.aqaraAppKey,
            keyId: config.aqaraKeyId,
            accessToken: config.aqaraAccessToken || undefined,
            refreshToken: config.aqaraRefreshToken || undefined,
            region: (config.aqaraRegion as AqaraConfig['region']) || 'eu'
        };
    }
}
