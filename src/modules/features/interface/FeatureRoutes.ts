import { Router } from "express";
import { FeatureController } from "./FeatureController";

export function featureRoutes(controller: FeatureController): Router {
  const router = Router();

  router.get("/features", (req, res) =>
    controller.listFeatures(req, res)
  );

  return router;
}
