import { Request, Response } from 'express';
import { GetCarAnalyticsUseCase } from '../application/GetCarAnalyticsUseCase';
import { InvalidFuelAnalyticsInputError } from '../domain/FuelAnalyticsCalculator';
import { AnalyticsBusyError, AnalyticsLimitError, AnalyticsNotFoundError } from '../domain/repository/CarAnalyticsRepository';

export class CarAnalyticsController {
    constructor(private readonly analytics: Pick<GetCarAnalyticsUseCase, 'execute'>) {}

    /**
     * @openapi
     * /api/cars/{id}/analytics:
     *   get:
     *     summary: Cztery wykresy paliwa z metadanymi jakości i cache przez 5 minut
     *     description: Domyślnie ostatnie 12 miesięcy UTC i PB95. Obie daty albo żadna; zakres włącznie, maksymalnie 5 lat. Maksymalnie 1000 punktów na paliwo i 5000 rekordów wraz z kontekstem. Zapis paliwa unieważnia cache auta. Cena litra obejmuje wszystkie paliwa, pozostałe metryki wybrane paliwo.
     *     tags: [Car]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema: { type: string }
     *       - in: query
     *         name: from
     *         schema: { type: string, format: date }
     *       - in: query
     *         name: to
     *         schema: { type: string, format: date }
     *       - in: query
     *         name: fuelType
     *         schema: { type: string, enum: [PB95, PB98, DIESEL, LPG, ELECTRIC], default: PB95 }
     *     responses:
     *       200:
     *         description: Dokument wykresów v1, auto, czas obliczenia i analiza; brak tankowań daje puste serie. ELECTRIC nie ma metryk litrowych.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               required: [car, generatedAt, document, analytics]
     *               properties:
     *                 car:
     *                   type: object
     *                   required: [id, name]
     *                   properties:
     *                     id: { type: string }
     *                     name: { type: string }
     *                 generatedAt: { type: string, format: date-time }
     *                 document:
     *                   type: object
     *                   required: [version, charts]
     *                   properties:
     *                     version: { type: integer, enum: [1] }
     *                     charts:
     *                       type: array
     *                       items: { $ref: '#/components/schemas/AnalyticsChart' }
     *                 analytics:
     *                   type: object
     *                   properties:
     *                     filter:
     *                       type: object
     *                       properties:
     *                         from: { type: string, format: date }
     *                         to: { type: string, format: date }
     *                         fuelType: { type: string }
     *                     availableFuelTypes: { type: array, items: { type: string } }
     *                     warnings: { type: array, items: { type: string } }
     *                     skipped: { type: object, additionalProperties: { type: integer } }
     *                     points: { type: array, items: { $ref: '#/components/schemas/FuelAnalyticsPoint' } }
     *                     pricePoints: { type: array, items: { $ref: '#/components/schemas/FuelAnalyticsPoint' } }
     *       400: { description: Nieprawidłowe filtry lub przekroczony limit danych }
     *       404: { description: Samochód nie istnieje }
     *       503: { description: Limit równoczesnych obliczeń; ponów później }
     *       500: { description: Błąd odczytu lub generowania; wynik nie jest cacheowany }
     */
    async get(req: Request, res: Response): Promise<void> {
        res.setHeader('Cache-Control', 'no-store');
        try {
            const result = await this.analytics.execute(req.params.id, req.query);
            res.json(result);
        } catch (error) {
            if (error instanceof InvalidFuelAnalyticsInputError || error instanceof AnalyticsLimitError) {
                res.status(400).json({ error: error.message });
            } else if (error instanceof AnalyticsNotFoundError) {
                res.status(404).json({ error: error.message });
            } else if (error instanceof AnalyticsBusyError) {
                res.setHeader('Retry-After', '1');
                res.status(503).json({ error: error.message });
            } else {
                console.error(error);
                res.status(500).json({ error: 'Nie udało się przygotować analizy auta.' });
            }
        }
    }
}
