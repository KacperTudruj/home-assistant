import { Request, Response } from "express";
import { GetSmartHomeDevicesUseCase } from "../application/GetSmartHomeDevicesUseCase";
import { UpdateCameraLabelUseCase } from "../application/UpdateCameraLabelUseCase";

export class SmartHomeController {
    constructor(
        private readonly getSmartHomeDevicesUseCase: GetSmartHomeDevicesUseCase,
        private readonly updateCameraLabelUseCase: UpdateCameraLabelUseCase
    ) {}

    async getDevices(req: Request, res: Response): Promise<void> {
        try {
            const devices = await this.getSmartHomeDevicesUseCase.execute();
            res.json(devices);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async updateCameraLabel(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { label } = req.body;
            await this.updateCameraLabelUseCase.execute(id, label);
            res.status(204).send();
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}
