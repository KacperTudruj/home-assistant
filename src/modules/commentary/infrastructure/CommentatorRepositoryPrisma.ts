import { PrismaClient } from "@prisma/client";
import { CommentatorRepository } from "../domain/repository/CommentatorRepository";
import { Commentator } from "../domain/entity/Commentator";


export class CommentatorRepositoryPrisma implements CommentatorRepository {

  constructor(private readonly prisma: PrismaClient) {}

  async find(id: string): Promise<Commentator | null> {
    const row = await this.prisma.commentator.findUnique({
      where: { id }
    });

    if (!row) return null;

    return new Commentator(
      row.id,
      row.key,
      row.name,
      row.style,
      row.enabled
    );
}


  async findAll(): Promise<Commentator[]> {
    const rows = await this.prisma.commentator.findMany({
      where: { enabled: true },
    });

    return rows.map(
      (r: Commentator) => 
        new Commentator(
          r.id,
          r.key,
          r.name,
          r.style,
          r.enabled
      )
    );

  }
}
