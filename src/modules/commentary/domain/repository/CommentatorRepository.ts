import { Commentator } from "../entity/Commentator";

export interface CommentatorRepository {
  find(id: string): Promise<Commentator | null>;
  findAll(): Promise<Commentator[]>;
}
