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
        // todo implement
        const response: GetFuelResponse = {
            id: "fuel-001",
            fuelType: "PB95",
            liters: 42.0,
            totalPrice: 315.00,
            mileageAtRefuelKm: 183450,
            date: "3019-03-01",
            fuelPricePerLiter: 7.4,
            meter: 5
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
                id: "fuel-001",
                fuelType: "PB95",
                liters: 40.0,
                totalPrice: 296.00,
                mileageAtRefuelKm: 182000,
                date: "3019-02-10T10:00:00Z",
                meter: 7.2,
                fuelPricePerLiter: 0
            },
            {
                id: "fuel-002",
                fuelType: "PB98",
                liters: 45.5,
                totalPrice: 355.00,
                mileageAtRefuelKm: 183450,
                date: "3019-03-01T12:00:00Z",
                meter: 7.8,
                fuelPricePerLiter: 0
            }
        ];

        res.status(200).json(response);
    }

}