import { Router } from 'express';
import { ReminderController } from './ReminderController';

export function ReminderRoutes(controller: ReminderController): Router {
    const router = Router();
    router.get('/reminders', (req, res) => controller.list(req, res));
    router.post('/reminders', (req, res) => controller.create(req, res));
    router.patch('/reminders/:id', (req, res) => controller.update(req, res));
    router.post('/reminders/:id/complete', (req, res) => controller.complete(req, res));
    return router;
}
