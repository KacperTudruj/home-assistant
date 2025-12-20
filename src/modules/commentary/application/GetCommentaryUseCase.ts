import { CommentaryPresenter } from "../domain/CommentaryPresenter";
import { CommentaryRepository as CommentaryRepo } from "../domain/Repository/CommentaryRepository";
import { CommentatorRepository } from "../domain/Repository/CommentatorRepository";

export class GetCommentaryForFeatureUseCase {
  constructor(
    private commentaryRepo: CommentaryRepo,
    private commentatorRepo: CommentatorRepository,
    private presenter: CommentaryPresenter
  ) {}

  async execute(id: string, featureKey: string, tags?: string[]) {
    const narrator =
      await this.commentatorRepo.find(id);

    if (!narrator) return null;

    const commentaries =
      await this.commentaryRepo.find({
        featureKey,
        tags,
        commentatorId: narrator.id
      });

    return this.presenter.present(commentaries);
  }
}
