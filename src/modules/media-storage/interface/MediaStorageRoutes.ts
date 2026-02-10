import { Router } from 'express';
import { MediaStorageController } from './MediaStorageController';

export const MediaStorageRoutes = (controller: MediaStorageController) => {
    const router = Router();

    router.get('/media-storage/status', (req, res) =>
        controller.getStatus(req, res)
    );

    router.get('/media-storage/browse', (req, res) =>
        controller.browse(req, res)
    );

    router.get('/media-storage/file', (req, res) =>
        controller.streamFile(req, res)
    );

    router.get('/media-storage/import', (req, res) =>
        controller.getImportUsage(req, res)
    );

    router.post(
        '/media-storage/import',
        controller.uploadToImport.bind(controller)
    );

    router.delete('/media-storage/import', (req, res) =>
        controller.deleteFromImport(req, res)
    );

    return router;
}
