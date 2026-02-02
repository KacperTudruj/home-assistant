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
            if (!date || !liters || !meter || !totalPrice || !fuelPricePerLiter) {
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
            const odometer = Number(meter);

            const created = await prisma.fuelRecord.create({
                data: {
                    carId,
                    fuelType: (fuelType as any) || "PB95",
                    liters: Number(liters),
                    totalPrice: Number(totalPrice),
                    mileageAtRefuelKm: mileageAtRefuelKm ? Number(mileageAtRefuelKm) : odometer,
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
    async listFuels(req: Request, res: Response): Promise<void> {
        try {
            const carId = req.params.id || req.params.carId;
            if (!carId) {
                res.status(400).json({ error: "Brak parametru id samochodu" });
                return;
            }

            const fuels = await prisma.fuelRecord.findMany({
                where: { carId },
                orderBy: { date: "desc" },
            });

            // aby wyliczyć statystyki, potrzebujemy poprzedniego wpisu – pracujemy na kopii posortowanej rosnąco
            const sortedAsc = [...fuels].sort((a, b) => +a.date - +b.date);
            const computed: GetFuelResponse[] = [] as any;

            for (let i = 0; i < sortedAsc.length; i++) {
                const curr = sortedAsc[i];
                const prev = i > 0 ? sortedAsc[i - 1] : undefined;
                const distance = prev ? (curr.mileageAtRefuelKm - prev.mileageAtRefuelKm) : null;
                const daysSincePreviousRefuel = prev ? Math.round((+curr.date - +prev.date) / (1000 * 60 * 60 * 24)) : null;
                const fuelConsumptionPer100Km = distance && distance > 0 ? Number(((curr.liters / distance) * 100).toFixed(2)) : null;
                const costPer100Km = distance && distance > 0 ? Number(((curr.totalPrice / distance) * 100).toFixed(2)) : null;

                computed.push({
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

            // chcemy zwracać w kolejności malejącej po dacie
            const response = computed.sort((a, b) => (a.date < b.date ? 1 : -1));
            res.status(200).json(response);
        } catch (e) {
            console.error(e);
            res.status(500).json({ error: "Błąd serwera" });
        }
    }

}