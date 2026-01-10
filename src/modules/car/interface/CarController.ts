import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

import { Car } from '../domain/entity/Car';
import { CarRepositoryPrisma } from '../infrastructure/CarRepositoryPrisma';

const prisma = new PrismaClient();
const carRepository = new CarRepositoryPrisma(prisma);

export class CarController {

    /**
     * @openapi
     * /api/cars:
     *   post:
     *     summary: Tworzy nowy samochód
     *     tags:
     *       - Car
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateCarRequest'
     *     responses:
     *       201:
     *         description: Samochód utworzony
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/CarResponse'
     *       400:
     *         description: Nieprawidłowe dane wejściowe
     */
    async create(req: Request, res: Response): Promise<void> {
        const { name } = req.body;

        if (!name || typeof name !== 'string') {
            res.status(400).json({ error: 'Invalid car name' });
            return;
        }

        const car = new Car({
            id: crypto.randomUUID(),
            name,
        });

        await carRepository.save(car);

        res.status(201).json({
            id: car.id,
            name: car.name,
        });
    }

    /**
     * @openapi
     * /api/cars/{id}:
     *   get:
     *     summary: Pobiera dane samochodu
     *     tags:
     *       - Car
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         example: 7c8a4e5a-9d4c-4c7f-b5d2-123456789abc
     *     responses:
     *       200:
     *         description: Dane samochodu
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/CarResponse'
     *       404:
     *         description: Samochód nie istnieje
     */
    async getById(req: Request, res: Response): Promise<void> {
        const { id } = req.params;

        const car = await carRepository.findById(id);

        if (!car) {
            res.status(404).json({ error: 'Car not found' });
            return;
        }

        res.json({
            id: car.id,
            name: car.name,
        });
    }
}
