import { PrismaClient } from "@prisma/client";
import { CommentaryRepository } from "../domain/CommentaryRepository";
import { Commentary } from "../domain/entity/Commentary";
import { Commentator } from "../domain/entity/Commentator";

export class CommentaryRepositoryPrisma implements CommentaryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async find(params: {
    featureKey: string;
    tags?: string[];
    commentatorId: string;
  }) {

    const { featureKey, tags, commentatorId } = params;
    
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

    async save(commentary: Commentary): Promise<void> {
    await this.prisma.commentary.create({
      data: {
        id: commentary.id,
        text: commentary.text,
        featureKeys: commentary.featureKeys,
        tags: commentary.tags,
        enabled: commentary.enabled,
        commentatorId: commentary.commentatorId,
      }
    });
  }

    async findAll(): Promise<Commentator[]> {
    const rows = await this.prisma.commentator.findMany({
      where: { enabled: true },
    });

    return rows.map(
      r => new Commentator(
        r.id,
        r.key,
        r.name,
        r.style,
        r.enabled
      )
    );
  }


}
