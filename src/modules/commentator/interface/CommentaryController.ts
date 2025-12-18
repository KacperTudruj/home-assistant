import { Request, Response } from "express";
import { GetCommentaryForFeatureUseCase } from "../application/GetCommentaryForFeatureUseCase";
import { CreateCommentaryUseCase } from "../application/CreateCommentaryUseCase";
import { GetCommentatorsUseCase } from "../application/GetCommentatorsUseCase";

export class CommentaryController {
  constructor(
    private readonly getCommentaryForFeatureUseCase: GetCommentaryForFeatureUseCase,
    private readonly createCommentaryUseCase: CreateCommentaryUseCase,
    private readonly getCommentatorsUseCase: GetCommentatorsUseCase
  ) {}

    async get(req: Request, res: Response): Promise<void> {
        const featureKey = req.query.feature as string;
        const tagsParam = req.query.tags as string | undefined;

        if (!featureKey) {
        res.status(400).json({ error: "feature is required" });
        return;
        }

        const tags = tagsParam ? tagsParam.split(",") : undefined;

        const commentary = await this.getCommentaryForFeatureUseCase.execute(
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

    async create(req: Request, res: Response): Promise<void> {
    const { text, featureKeys, tags, commentatorId } = req.body;

    if (!text || !featureKeys || !commentatorId) {
        res.status(400).json({ error: "Invalid payload" });
        return;
    }

    const commentary = await this.createCommentaryUseCase.execute({
        text,
        featureKeys,
        tags,
        commentatorId,
    });

    res.status(201).json({
        id: commentary.id,
        text: commentary.text
    });
    }

    async listCommentators(req: Request, res: Response): Promise<void> {
    const commentators = await this.getCommentatorsUseCase.execute();

    res.json(
        commentators.map(c => ({
        id: c.id,
        key: c.key,
        name: c.name
        }))
    );
    }


}
