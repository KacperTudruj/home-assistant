import {Request, Response} from 'express';
import {StorageHttpMapper} from './mapper/StorageHttpMapper';
import {StorageService} from "../domain/StorageService";
import {UploadFileInput} from "../domain/dto/UploadFileInput";

export class MediaStorageController {

    constructor(
        private readonly storageService: StorageService
    ) {
    }

    /**
     * @openapi
     * /api/media-storage/status:
     *   get:
     *     summary: Status podłączonego storage (USB)
     *     tags:
     *       - MediaStorage
     *     responses:
     *       200:
     *         description: Status storage
     *       503:
     *         description: Storage niedostępny
     */
    async getStatus(req: Request, res: Response): Promise<void> {
        const status = await this.storageService.getStatus();

        if (!status.isAvailable) {
            res.status(503).json({error: 'STORAGE_UNAVAILABLE'});
            return;
        }

        res.json(StorageHttpMapper.toStatusDto(status));
    }

    /**
     * @openapi
     * /api/media-storage/browse:
     *   get:
     *     summary: Przeglądanie plików (read-only)
     *     tags:
     *       - MediaStorage
     *     parameters:
     *       - in: query
     *         name: path
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Lista plików
     */
    async browse(req: Request, res: Response): Promise<void> {
        const path = String(req.query.path || '/');

        const files = await this.storageService.browse(path);
        res.json(StorageHttpMapper.toBrowseDto(files));
    }

    /**
     * @openapi
     * /api/media-storage/file:
     *   get:
     *     summary: Podgląd pliku (stream)
     *     tags:
     *       - MediaStorage
     *     parameters:
     *       - in: query
     *         name: path
     *         required: true
     *         schema:
     *           type: string
     */
    async streamFile(req: Request, res: Response): Promise<void> {
        const path = req.query.path as string;

        if (!path) {
            res.status(400).json({error: 'PATH_REQUIRED'});
            return;
        }

        const stream = await this.storageService.getFileStream(path);
        stream.pipe(res);
    }

    /**
     * @openapi
     * /api/media-storage/import:
     *   get:
     *     summary: Zużycie folderu import
     *     tags:
     *       - MediaStorage
     */
    async getImportUsage(req: Request, res: Response): Promise<void> {
        const usage = await this.storageService.getImportUsage();
        res.json(StorageHttpMapper.toImportUsageDto(usage));
    }

    /**
     * @openapi
     * /api/media-storage/import:
     *   post:
     *     summary: Upload pliku do importu
     *     tags:
     *       - MediaStorage
     */
    async uploadToImport(req: Request, res: Response): Promise<void> {
        if (!req.file) {
            res.status(400).json({error: 'FILE_REQUIRED'});
            return;
        }
        const file: UploadFileInput = {
            filename: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size,
            stream: req.file.stream,
        };
        await this.storageService.uploadToImport(file);
        res.status(204).send();
    }

    /**
     * @openapi
     * /api/media-storage/import:
     *   delete:
     *     summary: Usuwa plik z importu
     *     tags:
     *       - MediaStorage
     */
    async deleteFromImport(req: Request, res: Response): Promise<void> {
        const {path} = req.body;

        if (!path) {
            res.status(400).json({error: 'PATH_REQUIRED'});
            return;
        }

        await this.storageService.deleteFromImport(path);
        res.status(204).send();
    }
}
