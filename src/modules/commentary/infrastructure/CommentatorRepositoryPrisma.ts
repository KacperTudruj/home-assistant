import { PrismaClient } from "@prisma/client";
import { CommentatorRepository } from "../domain/Repository/CommentatorRepository";
import { Commentator } from "../domain/entity/Commentator";


export class CommentatorRepositoryPrisma implements CommentatorRepository {

  constructor(private readonly prisma: PrismaClient) {}

  async find(id: string): Promise<Commentator | null> {

    const rows = await this.prisma.commentary.findMany({
      where: {
        id: id,
      }
    });
    throw new Error("Method not implemented.");
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
