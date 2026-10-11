import { Request, Response } from 'express';
import { CreateServiceRecordUseCase } from '../application/CreateServiceRecordUseCase';
import { ListServiceRecordsUseCase } from '../application/ListServiceRecordsUseCase';
import { CreateServiceRecordRequest } from './dto/CreateServiceRecordRequest';
import { InvalidServiceLocationError } from '../domain/entity/ServiceRecord';
import { InvalidServiceLabelError } from '../domain/value-object/ServiceLabel';
import { serviceLabelOptions } from './dto/ServiceLabelOptions';

export class ServiceController {
    constructor(
        private readonly createServiceRecordUseCase: CreateServiceRecordUseCase,
        private readonly listServiceRecordsUseCase: ListServiceRecordsUseCase
    ) {}

    /**
     * @openapi
     * /api/cars/{id}/services:
     *   post:
     *     summary: Dodaje rekord serwisowy (zdarzenie)
     *     tags:
     *       - Car
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               description:
     *                 type: string
     *                 description: Swobodny, wielowierszowy opis całej wizyty.
     *               workshopName:
     *                 type: string
     *                 nullable: true
     *                 maxLength: 200
     *               workshopAddress:
     *                 type: string
     *                 nullable: true
     *                 maxLength: 500
     *               cost:
     *                 type: number
     *               mileageKm:
     *                 type: number
     *               date:
     *                 type: string
     *                 format: date-time
     *               label:
     *                 type: string
     *                 nullable: true
     *                 enum: [OIL_CHANGE, FILTERS, BATTERY, INSPECTION, REPAIR]
     *     responses:
     *       204:
     *         description: Rekord dodany
     *       400:
     *         description: Niepoprawna etykieta, nazwa lub adres warsztatu
     *       404:
     *         description: Samochód nie istnieje
     */
    async create(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const body = req.body as CreateServiceRecordRequest;

        let created: boolean;
        try {
            created = await this.createServiceRecordUseCase.execute(id, body);
        } catch (error) {
            if (!(error instanceof InvalidServiceLocationError) && !(error instanceof InvalidServiceLabelError)) throw error;
            res.status(400).json({ error: error.message });
            return;
        }
        if (!created) {
            res.status(404).json({ error: 'Car not found' });
            return;
        }

        res.status(204).send();
    }

    /**
     * @openapi
     * /api/cars/{id}/services:
     *   get:
     *     summary: Pobiera listę rekordów serwisowych
     *     tags:
     *       - Car
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Lista rekordów serwisowych
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: object
     *                 properties:
     *                   id: { type: string }
     *                   carId: { type: string }
     *                   description: { type: string }
     *                   cost: { type: number }
     *                   mileageKm: { type: integer }
     *                   date: { type: string, format: date-time }
     *                   label: { type: string, nullable: true, enum: [OIL_CHANGE, FILTERS, BATTERY, INSPECTION, REPAIR] }
     *                   workshopName: { type: string, nullable: true, maxLength: 200 }
     *                   workshopAddress: { type: string, nullable: true, maxLength: 500 }
     */
    async list(req: Request, res: Response): Promise<void> {
        const { id } = req.params;

        const services = await this.listServiceRecordsUseCase.execute(id);

        res.json(services);
    }

    /**
     * @openapi
     * /api/cars/service-labels:
     *   get:
     *     tags: [Car]
     *     summary: Dostępne etykiety wpisów serwisowych
     *     responses:
     *       200:
     *         description: Klucze etykiet i nazwy do wyświetlenia; brak etykiety to null
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: object
     *                 properties:
     *                   value: { type: string, enum: [OIL_CHANGE, FILTERS, BATTERY, INSPECTION, REPAIR] }
     *                   label: { type: string }
     */
    labels(_req: Request, res: Response): void {
        res.json(serviceLabelOptions);
    }
}
