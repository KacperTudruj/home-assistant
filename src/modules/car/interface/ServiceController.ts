import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

import { CarRepositoryPrisma } from '../infrastructure/CarRepositoryPrisma';
import { ServiceRecord } from '../domain/entity/ServiceRecord';
import { CreateServiceRecordRequest } from './dto/CreateServiceRecordRequest';

const prisma = new PrismaClient();
const carRepository = new CarRepositoryPrisma(prisma);

export class ServiceController {

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

        const car = await carRepository.findById(id);
        if (!car) {
            res.status(404).json({ error: 'Car not found' });
            return;
        }

        const record = new ServiceRecord({
            description: body.description,
            cost: Number(body.cost),
            mileageKm: Number(body.mileageKm),
            date: new Date(body.date),
            isOilChange: body.isOilChange
        });

        await prisma.serviceRecord.create({
            data: {
                carId: id,
                description: record.description,
                cost: record.cost,
                mileageKm: record.mileageKm,
                date: record.date,
                isOilChange: record.isOilChange
            }
        });

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

        const services = await prisma.serviceRecord.findMany({
            where: { carId: id },
            orderBy: { date: 'desc' }
        });

        res.json(services);
    }
}
