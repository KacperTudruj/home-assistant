import { Router } from "express";
import { SmartHomeController } from "./SmartHomeController";

export const SmartHomeRoutes = (controller: SmartHomeController): Router => {
    const router = Router();

    router.get("/smart-home/devices", (req, res) => controller.getDevices(req, res));

    return router;
};
