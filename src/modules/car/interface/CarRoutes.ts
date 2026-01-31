import { Router } from "express";
import { CarController } from "./CarController";
import { FuelController } from "./FuelController";

export function CarRoutes(
    carController: CarController,
    fuelController: FuelController
): Router {
  const router = Router();

  router.post("/cars", (req, res) =>
      carController.create(req, res)
  );

  router.get("/cars/:id", (req, res) =>
      carController.getById(req, res)
  );

  router.get("/cars", (req, res) =>
      carController.listCars(req, res)
  );

  router.post("/cars/:id/fuel", (req, res) =>
      fuelController.create(req, res)
  );

  router.get("/cars/:id/fuel/:fuelId", (req, res) =>
      fuelController.getById(req, res)
  );

  router.get("/cars/:id/fuels", (req, res) =>
      fuelController.listFuels(req, res)
  );

  return router;
}
