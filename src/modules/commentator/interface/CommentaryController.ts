import { Request, Response } from "express";
import { GetCommentaryForFeatureUseCase } from "../application/GetCommentaryForFeatureUseCase";

export class CommentaryController {
  constructor(
    private readonly getCommentaryForFeature: GetCommentaryForFeatureUseCase
  ) {}

  async handle(req: Request, res: Response): Promise<void> {
    const featureKey = req.query.feature as string;
    const tagsParam = req.query.tags as string | undefined;

    if (!featureKey) {
      res.status(400).json({ error: "feature is required" });
      return;
    }

    const tags = tagsParam ? tagsParam.split(",") : undefined;

    const commentary = await this.getCommentaryForFeature.execute(
      featureKey,
      tags
    );

    if (!commentary) {
      res.status(204).send();
      return;
    }

    res.json({
      text: commentary.text,
      commentatorId: commentary.commentatorId
    });
  }
}
