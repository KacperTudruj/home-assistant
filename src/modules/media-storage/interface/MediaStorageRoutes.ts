import { Router } from 'express';
import multer from 'multer';
import { MediaStorageController } from './MediaStorageController';

export const MediaStorageRoutes = (controller: MediaStorageController) => {
    const router = Router();

    const upload = multer({
        storage: multer.memoryStorage(),
        limits: {
            fileSize: 50 * 1024 * 1024, // 50MB
        },
    });

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
        upload.single('file'),
        controller.uploadToImport.bind(controller)
    );

    router.delete('/media-storage/import', (req, res) =>
        controller.deleteFromImport(req, res)
    );

    return router;
}
