import { Request, Response } from "express";
import { ListFeaturesUseCase } from "../application/ListFeaturesUseCase";
import { FeatureHttpMapper } from "./mapper/FeatureHttpMapper";

/**
 * @openapi
 * /api/features:
 *   get:
 *     summary: Pobiera listę feature’ów
 *     tags:
 *       - Features
 *     responses:
 *       200:
 *         description: Lista feature’ów
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FeatureResponse'
 */
export class FeatureController {
  constructor(
    private readonly listFeaturesUseCase: ListFeaturesUseCase
  ) {}

  async listFeatures(req: Request, res: Response): Promise<void> {
    const features = await this.listFeaturesUseCase.execute();

    const response =
      FeatureHttpMapper.toResponseList(features);

    res.json(response);
  }
}
