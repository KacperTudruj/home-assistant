import {Request, Response} from "express";
import {GetFuelResponse} from "@modules/car/interface/dto/GetFuelResponse";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
        try {
            const carId = req.params.id || req.params.carId;
            const {
                date,
                liters,
                meter,
                totalPrice,
                fuelPricePerLiter,
                mileageAtRefuelKm,
                fuelType
            } = req.body || {};

            if (!carId) {
                res.status(400).json({ error: "Brak parametru id samochodu" });
                return;
            }
            if (!date || liters === undefined || meter === undefined || totalPrice === undefined || fuelPricePerLiter === undefined) {
                res.status(400).json({ error: "Nieprawidłowe dane wejściowe" });
                return;
            }

            // Sprawdź czy auto istnieje
            const car = await prisma.car.findUnique({ where: { id: carId } });
            if (!car) {
                res.status(404).json({ error: "Samochód nie istnieje" });
                return;
            }

            const parsedDate = new Date(date);
            const parseNumber = (v: any) => {
                if (v === null || v === undefined) return undefined;
                const s = String(v).replace(',', '.');
                const n = parseFloat(s);
                return Number.isFinite(n) ? n : undefined;
            };

            const odometer = parseNumber(meter);
            const litersNum = parseNumber(liters);
            const totalPriceNum = parseNumber(totalPrice);
            const mileageAtRefuelNum = mileageAtRefuelKm !== undefined && mileageAtRefuelKm !== null ? parseNumber(mileageAtRefuelKm) : undefined;

            if (odometer === undefined || litersNum === undefined || totalPriceNum === undefined) {
                res.status(400).json({ error: "Nieprawidłowe wartości liczbowe" });
                return;
            }
            if (odometer < 0) {
                res.status(400).json({ error: "Licznik nie może być ujemny" });
                return;
            }

            const created = await prisma.fuelRecord.create({
                data: {
                    carId,
                    fuelType: (fuelType as any) || "PB95",
                    liters: litersNum,
                    totalPrice: totalPriceNum,
                    mileageAtRefuelKm: mileageAtRefuelNum !== undefined ? mileageAtRefuelNum : odometer,
                    date: parsedDate,
                },
            });

            // policz statystyki względem poprzedniego tankowania
            const prev = await prisma.fuelRecord.findFirst({
                where: { carId, date: { lt: created.date } },
                orderBy: { date: "desc" },
            });

            const distance = prev ? (created.mileageAtRefuelKm - prev.mileageAtRefuelKm) : null;
            const daysSincePreviousRefuel = prev ? Math.round((+created.date - +prev.date) / (1000 * 60 * 60 * 24)) : null;

            const fuelConsumptionPer100Km = distance && distance > 0 ? Number(((created.liters / distance) * 100).toFixed(2)) : null;
            const costPer100Km = distance && distance > 0 ? Number(((created.totalPrice / distance) * 100).toFixed(2)) : null;

            const response: GetFuelResponse = {
                id: created.id,
                date: created.date.toISOString().split("T")[0],
                liters: created.liters,
                meter: created.mileageAtRefuelKm,
                totalPrice: created.totalPrice,
                fuelPricePerLiter: fuelPricePerLiter ?? Number((created.totalPrice / created.liters).toFixed(2)),
                mileageAtRefuelKm: distance,
                fuelConsumptionPer100Km,
                costPer100Km,
                daysSincePreviousRefuel,
            } as any;

            res.status(201).json(response);
        } catch (e) {
            console.error(e);
            res.status(500).json({ error: "Błąd serwera podczas zapisu tankowania" });
        }
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
        try {
            const carId = req.params.id || req.params.carId;
            const fuelId = req.params.fuelId;
            if (!carId || !fuelId) {
                res.status(400).json({ error: "Brak wymaganych parametrów" });
                return;
            }

            const fuel = await prisma.fuelRecord.findUnique({ where: { id: fuelId } });
            if (!fuel || fuel.carId !== carId) {
                res.status(404).json({ error: "Tankowanie nie istnieje" });
                return;
            }

            const prev = await prisma.fuelRecord.findFirst({
                where: { carId, date: { lt: fuel.date } },
                orderBy: { date: "desc" },
            });

            const distance = prev ? (fuel.mileageAtRefuelKm - prev.mileageAtRefuelKm) : null;
            const daysSincePreviousRefuel = prev ? Math.round((+fuel.date - +prev.date) / (1000 * 60 * 60 * 24)) : null;
            const fuelConsumptionPer100Km = distance && distance > 0 ? Number(((fuel.liters / distance) * 100).toFixed(2)) : null;
            const costPer100Km = distance && distance > 0 ? Number(((fuel.totalPrice / distance) * 100).toFixed(2)) : null;

            const response: GetFuelResponse = {
                id: fuel.id,
                date: fuel.date.toISOString().split("T")[0],
                liters: fuel.liters,
                meter: fuel.mileageAtRefuelKm,
                totalPrice: fuel.totalPrice,
                fuelPricePerLiter: Number((fuel.totalPrice / fuel.liters).toFixed(2)),
                mileageAtRefuelKm: distance,
                fuelConsumptionPer100Km,
                costPer100Km,
                daysSincePreviousRefuel,
            } as any;

            res.status(200).json(response);
        } catch (e) {
            console.error(e);
            res.status(500).json({ error: "Błąd serwera" });
        }
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
     *       - in: query
     *         name: limit
     *         required: false
     *         schema:
     *           type: integer
     *           minimum: 1
     *           maximum: 100
     *           default: 5
     *         description: Ile ostatnich tankowań zwrócić (domyślnie 5)
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
        try {
            const carId = req.params.id || req.params.carId;
            if (!carId) {
                res.status(400).json({ error: "Brak parametru id samochodu" });
                return;
            }

            const limitRaw = req.query.limit as string | undefined;
            let limit = 5;
            if (limitRaw) {
                const parsed = parseInt(limitRaw, 10);
                if (Number.isFinite(parsed) && parsed > 0) {
                    limit = Math.min(Math.max(parsed, 1), 100);
                }
            }

            // pobierz n+1 rekordów, aby policzyć statystyki względem poprzedniego
            const fuelsDesc = await prisma.fuelRecord.findMany({
                where: { carId },
                orderBy: { date: "desc" },
                take: limit + 1,
            });

            const responses: GetFuelResponse[] = [] as any;
            for (let i = 0; i < fuelsDesc.length; i++) {
                if (i >= limit) break; // zwracamy tylko limit
                const curr = fuelsDesc[i];
                const prev = fuelsDesc[i + 1]; // starszy wpis

                const distance = prev ? (curr.mileageAtRefuelKm - prev.mileageAtRefuelKm) : null;
                const daysSincePreviousRefuel = prev ? Math.round((+curr.date - +prev.date) / (1000 * 60 * 60 * 24)) : null;
                const fuelConsumptionPer100Km = distance && distance > 0 ? Number(((curr.liters / distance) * 100).toFixed(2)) : null;
                const costPer100Km = distance && distance > 0 ? Number(((curr.totalPrice / distance) * 100).toFixed(2)) : null;

                responses.push({
                    id: curr.id,
                    date: curr.date.toISOString().split("T")[0],
                    liters: curr.liters,
                    meter: curr.mileageAtRefuelKm,
                    totalPrice: curr.totalPrice,
                    fuelPricePerLiter: Number((curr.totalPrice / curr.liters).toFixed(2)),
                    mileageAtRefuelKm: distance,
                    fuelConsumptionPer100Km,
                    costPer100Km,
                    daysSincePreviousRefuel,
                } as any);
            }

            res.status(200).json(responses);
        } catch (e) {
            console.error(e);
            res.status(500).json({ error: "Błąd serwera" });
        }
    }

}