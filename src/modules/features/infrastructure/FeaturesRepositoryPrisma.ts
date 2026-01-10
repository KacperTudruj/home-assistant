import { PrismaClient } from "@prisma/client";
import { Feature } from "../domain/entity/Feature";
import { FeaturesRepo } from "../domain/Repository/FeaturesRepo";
import { FeatureMapper } from "./FeatureMapper";

export class FeaturesRepositoryPrisma implements FeaturesRepo {

    constructor(
        private readonly prisma: PrismaClient
    ) { }


    async listAll(): Promise<Feature[]> {

        const apps = await this.prisma.app.findMany({
            where: {
                enabled: true,
            }, orderBy: {
                order: "asc",
            },
        });

        return apps.map(FeatureMapper.fromPrisma);
    }
}