import { ListFeaturesUseCase } from "../application/ListFeaturesUseCase";
import { Request, Response } from "express";

export class FeatureController {
  constructor(
    private readonly listFeaturesUseCase: ListFeaturesUseCase
  ) {}

  async getFeatures(req: Request, res: Response): Promise<void> {

    const features = await this.listFeaturesUseCase.execute();

    res.json(features);
  }
}