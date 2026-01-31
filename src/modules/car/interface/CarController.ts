import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

import { Car } from '../domain/entity/Car';
import { CarRepositoryPrisma } from '../infrastructure/CarRepositoryPrisma';
import { CarHttpMapper } from './mapper/CarHttpMapper';

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
     *       204:
     *         description: Samochód utworzony
     *       400:
     *         description: Nieprawidłowe dane wejściowe
     */
    async create(req: Request, res: Response): Promise<void> {
        const { name } = req.body;
        const { year } = req.body;

        if (!name || typeof name !== 'string') {
            res.status(400).json({ error: 'Invalid car name' });
            return;
        }

        if (!year || typeof year !== 'number') {
            res.status(400).json({ error: 'Invalid car year' });
            return;
        }

        const car = new Car({
            id: crypto.randomUUID(),
            name: name,
            year: new Date(year).getFullYear(),
            isActive: true,
        });

        await carRepository.save(car);

        res.status(204).send();
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
     *               $ref: '#/components/schemas/GetCarResponse'
     *       404:
     *         description: Samochód nie istnieje
     */
    async getById(req: Request, res: Response): Promise<void> {
        // fix  
        const { id } = req.params;

        const car = await carRepository.findById(id);

        if (!car) {
            res.status(404).json({ error: 'Car not found' });
            return;
        }

        const response =
            CarHttpMapper.toResponse(car);
        res.json(response);
    }

    /**
     * @openapi
     * /api/cars:
     *   get:
     *     summary: Lista samochodów
     *     tags:
     *       - Car
     *     responses:
     *       200:
     *         description: Lista samochodów
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/ItemGetCarResponseDto'
     */
    async listCars(req: Request, res: Response): Promise<void> {

        const cars = await carRepository.list();

        const response =
            CarHttpMapper.toResponseList(cars);
        res.json(response);
    }
}
