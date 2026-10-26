import { Router } from 'express';
import { HealthController } from './HealthController';

export function HealthRoutes(controller: HealthController): Router {
    const router = Router();
    router.get('/health/overview', (req, res) => controller.overview(req, res));
    router.put('/health/goal', (req, res) => controller.goal(req, res));
    router.put('/health/path', (req, res) => controller.path(req, res));
    router.post('/health/weights', (req, res) => controller.createWeight(req, res));
    router.put('/health/weights/:id', (req, res) => controller.updateWeight(req, res));
    router.delete('/health/weights/:id', (req, res) => controller.deleteWeight(req, res));
    router.post('/health/distances', (req, res) => controller.createDistance(req, res));
    router.put('/health/distances/:id', (req, res) => controller.updateDistance(req, res));
    router.delete('/health/distances/:id', (req, res) => controller.deleteDistance(req, res));
    return router;
}
