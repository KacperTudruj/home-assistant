import { PrismaClient } from "@prisma/client";
import { CommentatorRepository } from "../domain/Repository/CommentatorRepository";
import { Commentator } from "../domain/entity/Commentator";


export class CommentatorRepositoryPrisma
  implements CommentatorRepository {

  constructor(private readonly prisma: PrismaClient) {}

  find(id: string): Promise<Commentator | null> {
    throw new Error("Method not implemented.");
  }
  findAll(): Promise<Commentator[]> {
    throw new Error("Method not implemented.");
  }
}
