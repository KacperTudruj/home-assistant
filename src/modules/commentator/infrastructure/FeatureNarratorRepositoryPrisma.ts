import { PrismaClient } from "@prisma/client";
import { FeatureNarratorRepository } from "../domain/FeatureNarratorRepository";
import { FeatureNarrator } from "../domain/entity/FeatureNarrator";

export class FeatureNarratorRepositoryPrisma
  implements FeatureNarratorRepository {

  constructor(private readonly prisma: PrismaClient) {}

  async getForFeature(featureKey: string) {
    const row = await this.prisma.featureNarrator.findUnique({
      where: { featureKey }
    });

    if (!row) return null;

    return new FeatureNarrator(
      row.featureKey,
      row.commentatorId,
      row.priority
    );
  }
}
