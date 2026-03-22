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
     *       - in: query
     *         name: sortBy
     *         schema:
     *           type: string
     *           enum: [name, size, modifiedAt]
     *       - in: query
     *         name: sortOrder
     *         schema:
     *           type: string
     *           enum: [asc, desc]
     *       - in: query
     *         name: filter
     *         schema:
     *           type: string
     *       - in: query
     *         name: type
     *         schema:
     *           type: string
     *           enum: [file, directory]
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Lista plików z paginacją
     */
    async browse(req: Request, res: Response): Promise<void> {
        const path = String(req.query.path || '/');
        const options = {
            sortBy: req.query.sortBy as any,
            sortOrder: req.query.sortOrder as any,
            filter: req.query.filter as string,
            type: req.query.type as any,
            page: req.query.page ? parseInt(req.query.page as string) : undefined,
            limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        };

        const result = await this.storageService.browse(path, options);
        res.json(StorageHttpMapper.toBrowseDto(result));
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

        try {
            const {stream, mimeType, size} = await this.storageService.getFileStream(path);
            
            res.setHeader('Content-Type', mimeType);
            res.setHeader('Content-Length', size);

            const isPreviewable = mimeType.startsWith('image/') || mimeType.startsWith('video/') || mimeType === 'application/pdf';
            if (!isPreviewable) {
                res.setHeader('Content-Disposition', `attachment; filename="${path.split('/').pop()}"`);
            } else {
                res.setHeader('Content-Disposition', `inline; filename="${path.split('/').pop()}"`);
            }

            stream.pipe(res);
        } catch (error) {
            res.status(404).json({error: 'FILE_NOT_FOUND'});
        }
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
