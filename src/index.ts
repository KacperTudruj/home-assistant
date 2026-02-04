import express from "express";
import path from "path";
import { PrismaClient } from "@prisma/client";

import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./docs/openapi";

import { CommentaryRepositoryPrisma } from "@modules/commentary/infrastructure/CommentaryRepositoryPrisma";

import { CommentaryPresenter } from "./modules/commentary/domain/CommentaryPresenter";
import { GetCommentaryForFeatureUseCase } from "./modules/commentary/application/GetCommentaryUseCase";
import { CreateCommentaryUseCase } from "./modules/commentary/application/CreateCommentaryUseCase";
import { CommentaryController } from "./modules/commentary/interface/CommentaryController";
import { CommentatorRepositoryPrisma } from "@modules/commentary/infrastructure/CommentatorRepositoryPrisma";
import { ListCommentatorsUseCase } from "@modules/commentary/application/ListCommentatorsUseCase";
import { FeatureController } from "@modules/features/interface/FeatureController";
import { ListFeaturesUseCase } from "@modules/features/application/ListFeaturesUseCase";
import { FeaturesRepositoryPrisma } from "@modules/features/infrastructure/FeaturesRepositoryPrisma";
import { featureRoutes } from "@modules/features/interface/FeatureRoutes";
import { CommentaryRoutes } from "@modules/commentary/interface/CommentaryRoutes";
import { CarRoutes } from '@modules/car/interface/CarRoutes';
import { CarController } from "@modules/car/interface/CarController";
import {FuelController} from "@modules/car/interface/FuelController";
import { GetFuelStatisticsUseCase } from "@modules/car/application/GetFuelStatisticsUseCase";

const app = express();
const PORT = 3000;
const PAGES_DIR = path.join(__dirname, "..", "src", "pages");

app.use(express.json());

// swagger
app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);
// static
app.use(express.static(path.join(__dirname, "..", "public")));

// pages
app.get("/", (_, res) => {
  res.sendFile(path.join(PAGES_DIR, "home.html"));
});

app.get("/car-log", (_, res) => {
  res.sendFile(path.join(PAGES_DIR, "car-log.html"));
});

// ===== COMPOSITION ROOT =====
const prisma = new PrismaClient();

const commentaryRepo = new CommentaryRepositoryPrisma(prisma);
const narratorRepo = new CommentatorRepositoryPrisma(prisma);
const presenter = new CommentaryPresenter();
const getCommentaryForFeatureUseCase =
  new GetCommentaryForFeatureUseCase(
    commentaryRepo,
    narratorRepo,
    presenter
  );

const createCommentaryUseCase = new CreateCommentaryUseCase(commentaryRepo);
const listCommentatorsUseCase = new ListCommentatorsUseCase(narratorRepo);
const commentaryController = new CommentaryController(
  getCommentaryForFeatureUseCase,
  createCommentaryUseCase,
  listCommentatorsUseCase
);

const featuresRepo = new FeaturesRepositoryPrisma(prisma);
const listFeaturesUseCase = new ListFeaturesUseCase(featuresRepo);
const featureController = new FeatureController(listFeaturesUseCase);
const carController = new CarController();
const fuelStatisticsUseCase = new GetFuelStatisticsUseCase(prisma);
const fuelController = new FuelController(fuelStatisticsUseCase);
// ===== END COMPOSITION ROOT =====

// ===== ROUTES =====
// commentary
app.use("/api", CommentaryRoutes(commentaryController));
app.use("/api", featureRoutes(featureController));
app.use("/api", CarRoutes(carController, fuelController));


// health check
app.get("/api/health", (_, res) => { res.json({ status: "ok" }); });

// start server
app.listen(PORT, "0.0.0.0", () => { console.log("🐶 Jamnik Henryk uruchomił system"); });
