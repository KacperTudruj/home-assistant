import { Request, Response } from 'express';
import { HealthUseCases } from '../application/HealthUseCases';
import { HealthError } from '../domain/HealthRepository';

/**
 * @openapi
 * components:
 *   schemas:
 *     HealthWeightInput:
 *       type: object
 *       required: [date, kg]
 *       properties:
 *         date: { type: string, format: date }
 *         kg: { type: number, minimum: 0, exclusiveMinimum: true }
 *         note: { type: string, maxLength: 300 }
 *         replaceExisting: { type: boolean, description: Pozwala zastąpić pomiar z tego samego dnia. }
 *     HealthDistanceInput:
 *       type: object
 *       required: [date, km]
 *       properties:
 *         date: { type: string, format: date }
 *         km: { type: number, minimum: 0, exclusiveMinimum: true }
 *         note: { type: string, maxLength: 300 }
 * /api/health/overview:
 *   get:
 *     tags: [Health]
 *     summary: Cel, ścieżka oraz zapisane pomiary wagi i dystansu
 *     responses:
 *       200:
 *         description: Stan modułu Health
 * /api/health/goal:
 *   put:
 *     tags: [Health]
 *     summary: Ustawia cel wagi
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [kg]
 *             properties:
 *               kg: { type: number, minimum: 0, exclusiveMinimum: true }
 *     responses:
 *       204: { description: Cel zapisany }
 *       400: { description: Niepoprawny cel }
 * /api/health/path:
 *   put:
 *     tags: [Health]
 *     summary: Wybiera ścieżkę podróży
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pathId]
 *             properties:
 *               pathId: { type: string, enum: [frodo] }
 *     responses:
 *       204: { description: Ścieżka zapisana }
 * /api/health/weights:
 *   post:
 *     tags: [Health]
 *     summary: Dodaje pomiar wagi lub aktualizuje pomiar z tego dnia po potwierdzeniu
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/HealthWeightInput' }
 *     responses:
 *       204: { description: Pomiar zapisany }
 *       400: { description: Niepoprawny pomiar }
 *       409: { description: Pomiar z tego dnia już istnieje }
 * /api/health/weights/{id}:
 *   put:
 *     tags: [Health]
 *     summary: Edytuje pomiar wagi
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/HealthWeightInput' }
 *     responses:
 *       204: { description: Pomiar zapisany }
 *       404: { description: Nie znaleziono pomiaru }
 *       409: { description: Pomiar z tego dnia już istnieje }
 *   delete:
 *     tags: [Health]
 *     summary: Usuwa pomiar wagi
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Pomiar usunięty }
 *       404: { description: Nie znaleziono pomiaru }
 * /api/health/distances:
 *   post:
 *     tags: [Health]
 *     summary: Dodaje przebyty dystans; wiele wpisów jednego dnia jest dozwolonych
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/HealthDistanceInput' }
 *     responses:
 *       204: { description: Dystans zapisany }
 *       400: { description: Niepoprawny dystans }
 * /api/health/distances/{id}:
 *   put:
 *     tags: [Health]
 *     summary: Edytuje wpis dystansu
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/HealthDistanceInput' }
 *     responses:
 *       204: { description: Wpis zapisany }
 *       404: { description: Nie znaleziono wpisu }
 *   delete:
 *     tags: [Health]
 *     summary: Usuwa wpis dystansu
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Wpis usunięty }
 *       404: { description: Nie znaleziono wpisu }
 */
export class HealthController {
    constructor(private readonly useCases: HealthUseCases) {}

    private async respond(res: Response, action: () => Promise<unknown>, status = 204): Promise<void> {
        try {
            const result = await action();
            if (status === 204) res.status(204).send();
            else res.status(status).json(result);
        } catch (error) {
            if (!(error instanceof HealthError)) throw error;
            const status = error.code === 'NOT_FOUND' ? 404 : error.code === 'CONFLICT' ? 409 : 400;
            res.status(status).json({ error: error.message });
        }
    }

    async overview(_req: Request, res: Response): Promise<void> { await this.respond(res, () => this.useCases.getState(), 200); }
    async goal(req: Request, res: Response): Promise<void> { await this.respond(res, () => this.useCases.setGoal(req.body)); }
    async path(req: Request, res: Response): Promise<void> { await this.respond(res, () => this.useCases.setPath(req.body)); }
    async createWeight(req: Request, res: Response): Promise<void> { await this.respond(res, () => this.useCases.saveWeight(null, req.body)); }
    async updateWeight(req: Request, res: Response): Promise<void> { await this.respond(res, () => this.useCases.saveWeight(req.params.id, req.body)); }
    async deleteWeight(req: Request, res: Response): Promise<void> { await this.respond(res, () => this.useCases.deleteWeight(req.params.id)); }
    async createDistance(req: Request, res: Response): Promise<void> { await this.respond(res, () => this.useCases.createDistance(req.body)); }
    async updateDistance(req: Request, res: Response): Promise<void> { await this.respond(res, () => this.useCases.updateDistance(req.params.id, req.body)); }
    async deleteDistance(req: Request, res: Response): Promise<void> { await this.respond(res, () => this.useCases.deleteDistance(req.params.id)); }
}
