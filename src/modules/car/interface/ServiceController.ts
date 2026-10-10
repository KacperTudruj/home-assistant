import { Request, Response } from 'express';
import { CreateServiceRecordUseCase } from '../application/CreateServiceRecordUseCase';
import { ListServiceRecordsUseCase } from '../application/ListServiceRecordsUseCase';
import { CreateServiceRecordRequest } from './dto/CreateServiceRecordRequest';

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
     *               cost:
     *                 type: number
     *               mileageKm:
     *                 type: number
     *               date:
     *                 type: string
     *                 format: date-time
     *               isOilChange:
     *                 type: boolean
     *     responses:
     *       204:
     *         description: Rekord dodany
     *       404:
     *         description: Samochód nie istnieje
     */
    async create(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const body = req.body as CreateServiceRecordRequest;

        const created = await this.createServiceRecordUseCase.execute(id, body);
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
     */
    async list(req: Request, res: Response): Promise<void> {
        const { id } = req.params;

        const services = await this.listServiceRecordsUseCase.execute(id);

        res.json(services);
    }
}
