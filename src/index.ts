import express from "express";
import path from "path";
import { PrismaClient } from "@prisma/client";

import { CommentaryRepositoryPrisma } from "@modules/commentary/infrastructure/CommentaryRepositoryPrisma";
import { CommentaryPresenterRepositoryPrisma } from "./modules/commentary/infrastructure/CommentaryPresenterRepositoryPrisma";

import { CommentaryPresenter } from "./modules/commentary/domain/CommentaryPresenter";
import { GetCommentaryForFeatureUseCase } from "./modules/commentary/application/GetCommentaryUseCase";
import { CreateCommentaryUseCase } from "./modules/commentary/application/CreateCommentaryUseCase";
import { GetCommentatorsUseCase } from "./modules/commentary/application/GetCommentatorsUseCase";
import { CommentaryController } from "./modules/commentary/interface/CommentaryController";

const app = express();
const PORT = 3000;

app.use(express.json());

// static
app.use(express.static(path.join(__dirname, "..", "public")));

// pages
app.get("/", (_, res) => {
  res.sendFile(path.join(__dirname, "..", "pages", "home.html"));
});

app.get("/car-log", (_, res) => {
  res.sendFile(path.join(__dirname, "..", "pages", "car-log.html"));
});

// ===== COMPOSITION ROOT =====
const prisma = new PrismaClient();

const commentaryRepo = new CommentaryRepositoryPrisma(prisma);
const narratorRepo = new CommentaryPresenterRepositoryPrisma(prisma);

const presenter = new CommentaryPresenter();

const getCommentaryForFeatureUseCase =
  new GetCommentaryForFeatureUseCase(
    commentaryRepo,
    narratorRepo,
    presenter
  );

const createCommentaryUseCase =
  new CreateCommentaryUseCase(commentaryRepo);

const getCommentatorsUseCase =
  new GetCommentatorsUseCase(narratorRepo);

const commentaryController = new CommentaryController(
  getCommentaryForFeatureUseCase,
  createCommentaryUseCase,
  getCommentatorsUseCase
);

// ===== ROUTES =====
app.get("/api/commentary", (req, res) =>
  commentaryController.getCommentary(req, res)
);

app.post("/api/commentary", (req, res) =>
  commentaryController.createCommentary(req, res)
);

app.get("/api/commentators", (req, res) =>
  commentaryController.listCommentators(req, res)
);

app.get("/api/health", (_, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("🐶 Jamnik Henryk uruchomił system");
});
