import { Commentator } from "./entity/Commentator";

export interface CommentatorRepository {
  findAll(): Promise<Commentator[]>;
}
