import { Router } from "express";
import { CarController } from "./CarController";

export function CarRoutes(controller: CarController): Router {
  const router = Router();

  router.post("/cars", (req, res) =>
    controller.create(req, res)
  );

  router.get("/cars/:id", (req, res) =>
    controller.getById(req, res)
  );

  router.get("/cars", (req, res) =>
    controller.listCars(req, res)
  );

  return router;
}
