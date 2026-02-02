import {Request, Response} from "express";
import {GetFuelResponse} from "@modules/car/interface/dto/GetFuelResponse";

export class FuelController {

    /**
     * @openapi
     * /api/cars/{id}/fuel:
     *   post:
     *     summary: Dodaj tankowanie do samochodu
     *     tags:
     *       - Car
     *     parameters:
     *       - in: path
     *         name: carId
     *         required: true
     *         description: Identyfikator samochodu
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateFuelRecordRequest'
     *     responses:
     *       201:
     *         description: Tankowanie zostało zapisane
     *       400:
     *         description: Nieprawidłowe dane wejściowe
     *       404:
     *         description: Samochód nie istnieje
     */
    async create(req: Request, res: Response): Promise<void> {
        res.status(201).json({
            id: "fuel-mock-001",
            message: "Fuel record created (mock)"
        });
    }

    /**
     * @openapi
     * /api/cars/{carId}/fuel/{fuelId}:
     *   get:
     *     summary: Pobiera dane tankowania
     *     tags:
     *       - Car
     *     parameters:
     *       - in: path
     *         name: carId
     *         required: true
     *         description: Identyfikator samochodu
     *       - in: path
     *         name: fuelId
     *         required: true
     *         description: Identyfikator tankowania
     *     responses:
     *       200:
     *         description: Dane o tankowaniu
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/GetFuelResponse'
     *       404:
     *         description: Samochód nie istnieje
     */
    async getById(req: Request, res: Response): Promise<void> {
        const response: GetFuelResponse = {
            id: "fuel-001",
            date: "2024-01-15",
            liters: 42.0,
            meter: 183450,
            totalPrice: 315.00,
            fuelPricePerLiter: 7.50,
            mileageAtRefuelKm: 520,
            fuelConsumptionPer100Km: 8.08,
            costPer100Km: 60.58,
            daysSincePreviousRefuel: 14
        };

        res.status(200).json(response);
    }

    /**
     * @openapi
     * /api/cars/{carId}/fuels:
     *   get:
     *     summary: Lista tankowań
     *     tags:
     *       - Car
     *     parameters:
     *       - in: path
     *         name: carId
     *         required: true
     *         description: Identyfikator samochodu
     *     responses:
     *       200:
     *         description: ostatnich tankowań
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/ItemGetFuelResponse'
     */
    async listFuels(req: Request, res: Response): Promise<void> {
        const response: GetFuelResponse[] = [
            {
                id: "fuel-002",
                date: "2024-02-01",
                liters: 45.5,
                meter: 184000,
                totalPrice: 332.15,
                fuelPricePerLiter: 7.30,
                mileageAtRefuelKm: 550,
                fuelConsumptionPer100Km: 8.27,
                costPer100Km: 60.39,
                daysSincePreviousRefuel: 17
            },
            {
                id: "fuel-001",
                date: "2024-01-15",
                liters: 42.0,
                meter: 183450,
                totalPrice: 315.00,
                fuelPricePerLiter: 7.50,
                mileageAtRefuelKm: 520,
                fuelConsumptionPer100Km: 8.08,
                costPer100Km: 60.58,
                daysSincePreviousRefuel: 14
            }
        ];

        res.status(200).json(response);
    }

}