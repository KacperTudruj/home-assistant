import { CommentatorRepository } from "../domain/CommentatorRepository";

export class GetCommentatorsUseCase {
  constructor(
    private readonly repo: CommentatorRepository
  ) {}

  async execute() {
    return this.repo.findAll();
  }
}
