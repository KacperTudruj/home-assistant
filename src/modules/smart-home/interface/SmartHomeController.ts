import { Request, Response } from "express";
import { GetSmartHomeDevicesUseCase } from "../application/GetSmartHomeDevicesUseCase";

export class SmartHomeController {
    constructor(private readonly getSmartHomeDevicesUseCase: GetSmartHomeDevicesUseCase) {}

    async getDevices(req: Request, res: Response): Promise<void> {
        try {
            const devices = await this.getSmartHomeDevicesUseCase.execute();
            res.json(devices);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}
