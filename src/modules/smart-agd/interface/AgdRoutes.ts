import { Router } from "express";
import { AgdController } from "./AgdController";

export const AgdRoutes = (controller: AgdController) => {
    const router = Router();

    router.get("/agd/devices", (req, res) => controller.getDevices(req, res));

    return router;
};
