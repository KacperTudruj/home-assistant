import { Request, Response } from 'express';
import { ReminderError, ReminderUseCases } from '../application/ReminderUseCases';

export class ReminderController {
    constructor(private readonly useCases: ReminderUseCases) {}

    private async respond(res: Response, action: () => Promise<unknown>, status = 200): Promise<void> {
        try {
            res.status(status).json(await action());
        } catch (error) {
            if (!(error instanceof ReminderError)) throw error;
            const status = error.code === 'NOT_FOUND' ? 404 : error.code === 'INACTIVE' ? 409 : 400;
            res.status(status).json({ error: error.message });
        }
    }

    async create(req: Request, res: Response): Promise<void> {
        await this.respond(res, () => this.useCases.create(req.body), 201);
    }

    async list(req: Request, res: Response): Promise<void> {
        await this.respond(res, () => this.useCases.list(req.query));
    }

    async update(req: Request, res: Response): Promise<void> {
        await this.respond(res, () => this.useCases.update(req.params.id, req.body));
    }

    async complete(req: Request, res: Response): Promise<void> {
        await this.respond(res, () => this.useCases.complete(req.params.id));
    }
}
