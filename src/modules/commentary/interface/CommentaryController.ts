import { Request, Response } from "express";
import { GetCommentaryForFeatureUseCase } from "../application/GetCommentaryUseCase";
import { CreateCommentaryUseCase } from "../application/CreateCommentaryUseCase";
import { ListCommentatorsUseCase } from "../application/ListCommentatorsUseCase";

export class CommentaryController {
  constructor(
    private readonly getCommentaryForFeatureUseCase: GetCommentaryForFeatureUseCase,
    private readonly createCommentaryUseCase: CreateCommentaryUseCase,
    private readonly listCommentatorsUseCase: ListCommentatorsUseCase
  ) {}

    async getCommentary(req: Request, res: Response): Promise<void> {
        const commentatorId = req.query.commentatorId as string;
        const featureKey = req.query.feature as string;
        const tagsParam = req.query.tags as string | undefined;

        if (!featureKey) {
        res.status(400).json({ error: "feature is required" });
        return;
        }

        const tags = tagsParam ? tagsParam.split(",") : undefined;

        const commentary = await this.getCommentaryForFeatureUseCase.execute(
            commentatorId,
            featureKey,
            tags
        );

        if (!commentary) {
        res.status(404).send();
        return;
        }

        res.json({
        text: commentary.text,
        commentatorId: commentary.commentatorId
        });
    }

    async createCommentary(req: Request, res: Response): Promise<void> {
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
        const commentators =
            await this.listCommentatorsUseCase.execute();

        res.json(commentators);
    }    
}
