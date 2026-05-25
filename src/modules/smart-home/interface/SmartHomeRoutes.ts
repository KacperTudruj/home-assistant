import { Router } from "express";
import { SmartHomeController } from "./SmartHomeController";

export const SmartHomeRoutes = (controller: SmartHomeController): Router => {
    const router = Router();

    router.get("/smart-home/devices", (req, res) => controller.getDevices(req, res));
    router.put("/smart-home/cameras/:id/label", (req, res) => controller.updateCameraLabel(req, res));

    return router;
};
