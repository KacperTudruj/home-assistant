import { Router } from "express";
import { CommentaryController } from "./CommentaryController";

export function commentaryRoutes(
  controller: CommentaryController
): Router {
  const router = Router();

  // commentary
  router.get("/commentary", (req, res) =>
    controller.getCommentary(req, res)
  );

  router.post("/commentary", (req, res) =>
    controller.createCommentary(req, res)
  );

  router.get("/commentators", (req, res) =>
    controller.listCommentators(req, res)
  );

  return router;
}
