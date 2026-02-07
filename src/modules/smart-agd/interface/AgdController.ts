import { Request, Response } from "express";
import { GetAgdDevicesUseCase } from "../application/GetAgdDevicesUseCase";

export class AgdController {
    constructor(private readonly getAgdDevicesUseCase: GetAgdDevicesUseCase) {}

    /**
     * @openapi
     * /api/agd/devices:
     *   get:
     *     summary: Pobiera listę urządzeń AGD (lodówka, pralka, suszarka)
     *     tags:
     *       - AGD
     *     responses:
     *       200:
     *         description: Lista urządzeń AGD
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: object
     *                 properties:
     *                   id:
     *                     type: string
     *                   name:
     *                     type: string
     *                   label:
     *                     type: string
     *                   type:
     *                     type: string
     *                     enum: [WASHER, DRYER, REFRIGERATOR, OTHER]
     *       500:
     *         description: Błąd serwera
     */
    async getDevices(req: Request, res: Response): Promise<void> {
        try {
            const devices = await this.getAgdDevicesUseCase.execute();
            res.json(devices);
        } catch (error: any) {
            console.error("AGD Module Error:", error.message);
            res.status(500).json({ error: "Nie udało się pobrać urządzeń AGD" });
        }
    }
}
