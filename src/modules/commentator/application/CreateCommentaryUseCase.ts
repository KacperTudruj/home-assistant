import { CommentaryRepository } from "../domain/CommentaryRepository";
import { Commentary } from "../domain/entity/Commentary";
import { randomUUID } from "crypto";

export class CreateCommentaryUseCase {
  constructor(
    private readonly commentaryRepo: CommentaryRepository
  ) {}

  async execute(input: {
    text: string;
    featureKeys: string[];
    tags?: string[];
    commentatorId: string;
  }) {
    const commentary = new Commentary(
      randomUUID(),
      input.text,
      input.featureKeys,
      input.tags ?? [],
      input.commentatorId,
      true
    );

    await this.commentaryRepo.save(commentary);

    return commentary;
  }
}
