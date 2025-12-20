import { CommentaryPresenter } from "../domain/CommentaryPresenter";
import { CommentaryRepository as CommentaryRepo } from "../domain/Repository/CommentaryRepository";
import { CommentatorRepository } from "../domain/Repository/CommentatorRepository";

export class ListCommentatorsUseCase {
  constructor(
    private commentatorRepo: CommentatorRepository,
  ) {}

  async execute() {
    const narrators =
      await this.commentatorRepo.findAll();

    if (!narrators) return null;

    return narrators;
  }
}
