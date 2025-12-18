import { PrismaClient } from "@prisma/client";
import { CommentaryRepository } from "../domain/CommentaryRepository";
import { Commentary } from "../domain/entity/Commentary";

export class CommentaryRepositoryPrisma implements CommentaryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async find({ featureKey, tags, commentatorId }) {
    const rows = await this.prisma.commentary.findMany({
      where: {
        enabled: true,
        commentatorId,
        featureKeys: { has: featureKey },
        ...(tags?.length ? { tags: { hasSome: tags } } : {})
      }
    });

    return rows.map(
      r =>
        new Commentary(
          r.id,
          r.text,
          r.featureKeys,
          r.tags,
          r.commentatorId,
          r.enabled
        )
    );
  }
}
