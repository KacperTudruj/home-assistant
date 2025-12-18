import { CommentaryPresenter } from "../domain/CommentaryPresenter";
import { FeatureNarratorRepository } from "../domain/FeatureNarratorRepository";
import { CommentaryRepository as CommentaryRepo } from "../domain/CommentaryRepository";

export class GetCommentaryForFeatureUseCase {
  constructor(
    private commentaryRepo: CommentaryRepo,
    private narratorRepo: FeatureNarratorRepository,
    private presenter: CommentaryPresenter
  ) {}

  async execute(featureKey: string, tags?: string[]) {
    const narrator =
      await this.narratorRepo.getForFeature(featureKey);

    if (!narrator) return null;

    const commentaries =
      await this.commentaryRepo.find({
        featureKey,
        tags,
        commentatorId: narrator.commentatorId
      });

    return this.presenter.present(commentaries);
  }
}
