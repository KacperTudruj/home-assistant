import { PrismaClient } from "@prisma/client";
import { SmartThingsConfigRepository } from "../domain/SmartThingsClient";

export class SmartThingsConfigRepositoryPrisma implements SmartThingsConfigRepository {
    constructor(private readonly prisma: PrismaClient) {}

    async getSmartThingsToken(): Promise<string | null> {
        const config = await this.prisma.systemConfigurationSmartAgd.findFirst({
            where: { key: "SAMSUNG_SMARTTHINGS" }
        });
        return config?.samsungSmartThingsToken || null;
    }
}
