import fs from 'fs/promises';
import path from 'path';
import mime from 'mime';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import { Readable, pipeline, PassThrough } from 'stream';
import { promisify } from 'util';
import { createReadStream, createWriteStream } from 'fs';
import { StorageService } from "../domain/StorageService";
import { BrowseItem } from "../domain/dto/BrowseItem";
import { BrowseOptions, BrowseResponse } from "../domain/dto/BrowseOptions";
import { UploadFileInput } from "../domain/dto/UploadFileInput";

export class DiskStorageService implements StorageService {
    private readonly mountPath: string;
    private readonly temporaryPath: string;

    constructor(mountPath: string, temporaryPath: string) {
        this.mountPath = path.resolve(mountPath);
        this.temporaryPath = path.resolve(temporaryPath);
    }

    async getStatus() {
        try {
            await fs.access(this.mountPath);
            return {
                isAvailable: true,
                mountPath: this.mountPath,
            };
        } catch (error) {
            return {
                isAvailable: false,
                mountPath: this.mountPath,
            };
        }
    }

    async browse(relativeSubPath: string, options?: BrowseOptions): Promise<BrowseResponse> {
        const absolutePath = this.getSafePath(relativeSubPath);
        
        try {
            const entries = await fs.readdir(absolutePath, { withFileTypes: true });
            
            const itemsPromises = entries.map(async (entry) => {
                const entryPath = path.join(absolutePath, entry.name);
                
                try {
                    let relativeEntryPath = path.relative(this.mountPath, entryPath).replace(/\\/g, '/');
                    if (!relativeEntryPath.startsWith('/')) {
                        relativeEntryPath = '/' + relativeEntryPath;
                    }
                    
                    const stats = await fs.stat(entryPath);

                    if (entry.isDirectory()) {
                        return {
                            name: entry.name,
                            path: relativeEntryPath,
                            type: 'directory' as const,
                            modifiedAt: stats.mtime,
                        };
                    } else {
                        return {
                            name: entry.name,
                            path: relativeEntryPath,
                            type: 'file' as const,
                            size: stats.size,
                            mimeType: mime.getType(entryPath) || 'application/octet-stream',
                            modifiedAt: stats.mtime,
                        };
                    }
                } catch (error) {
                    console.error(`Error reading stats for ${entryPath}:`, error);
                    return null;
                }
            });

            let filteredItems: BrowseItem[] = [];
            for (const item of await Promise.all(itemsPromises)) {
                if (item !== null) {
                    filteredItems.push(item);
                }
            }

            // Filter system/hidden files/folders
            filteredItems = filteredItems.filter(i => {
                const isSystem = i.name.startsWith('$') || i.name.startsWith('.');
                return !isSystem;
            });

            // Filtering
            if (options?.filter) {
                const filter = options.filter.toLowerCase();
                filteredItems = filteredItems.filter(i => i.name.toLowerCase().includes(filter));
            }
            if (options?.type) {
                filteredItems = filteredItems.filter(i => i.type === options.type);
            }

            // Sorting
            if (options?.sortBy) {
                const sortBy = options.sortBy;
                const sortOrder = options.sortOrder === 'desc' ? -1 : 1;
                filteredItems.sort((a, b) => {
                    if (sortBy === 'name') {
                        return a.name.localeCompare(b.name) * sortOrder;
                    }
                    if (sortBy === 'size') {
                        return ((a.size || 0) - (b.size || 0)) * sortOrder;
                    }
                    if (sortBy === 'modifiedAt') {
                        return ((a.modifiedAt?.getTime() || 0) - (b.modifiedAt?.getTime() || 0)) * sortOrder;
                    }
                    return 0;
                });
            }

            const total = filteredItems.length;
            const page = options?.page || 1;
            const limit = options?.limit || total || 100;
            const startIndex = (page - 1) * limit;
            const paginatedItems = filteredItems.slice(startIndex, startIndex + limit);

            return {
                items: paginatedItems,
                total,
                page,
                limit,
            };
        } catch (error) {
            if ((error as any).code === 'ENOENT') {
                return { items: [], total: 0, page: 1, limit: 10 };
            }
            throw error;
        }
    }

    async getFileStream(relativeSubPath: string) {
        const absolutePath = this.getSafePath(relativeSubPath);
        const stats = await fs.stat(absolutePath);
        
        if (stats.isDirectory()) {
            throw new Error('Cannot stream a directory');
        }

        const mimeType = mime.getType(absolutePath) || 'application/octet-stream';

        return {
            stream: createReadStream(absolutePath),
            mimeType,
            size: stats.size,
        };
    }

    async getThumbnailStream(relativeSubPath: string) {
        const absolutePath = this.getSafePath(relativeSubPath);
        const stats = await fs.stat(absolutePath);

        if (stats.isDirectory()) {
            throw new Error('Cannot create thumbnail for a directory');
        }

        const mimeType = mime.getType(absolutePath) || 'application/octet-stream';

        if (mimeType.startsWith('image/')) {
            const transform = sharp()
                .resize(200, 200, { fit: 'inside', withoutEnlargement: true })
                .jpeg({ quality: 80 });

            const readStream = createReadStream(absolutePath);
            const stream = readStream.pipe(transform);

            return {
                stream,
                mimeType: 'image/jpeg',
                size: 0, // Size is unknown for transformed stream
            };
        }

        if (mimeType.startsWith('video/')) {
            const passThrough = new PassThrough();
            
            const stream = ffmpeg(absolutePath)
                .seekInput(1)
                .frames(1)
                .outputOptions('-f', 'image2')
                .outputOptions('-vcodec', 'mjpeg')
                .pipe(passThrough, { end: true }) as Readable;

            return {
                stream: stream,
                mimeType: 'image/jpeg',
                size: 0,
            };
        }

        // Fallback for non-media files: return the original or a generic icon (not implemented here)
        return this.getFileStream(relativeSubPath);
    }

    async getImportUsage() {
        const importPath = path.join(this.mountPath, 'import');
        try {
            await fs.mkdir(importPath, { recursive: true });
            const usage = await this.getDirSize(importPath);
            return {
                used: usage,
                max: 100 * 1024 * 1024 * 1024, // 100 GB
            };
        } catch (error) {
            return {
                used: 0,
                max: 100 * 1024 * 1024 * 1024,
            };
        }
    }

    async uploadToImport(file: UploadFileInput): Promise<void> {
        const importPath = path.join(this.mountPath, 'import');
        await fs.mkdir(importPath, { recursive: true });

        const safeFilename = path.basename(file.filename).replace(/[^\w.-]/g, '_');
        const targetPath = path.join(importPath, safeFilename);

        const writeStream = createWriteStream(targetPath);
        const streamPipeline = promisify(pipeline);

        await streamPipeline(file.stream, writeStream);
    }

    async deleteFromImport(relativeSubPath: string): Promise<void> {
        await this.moveToTemporary(relativeSubPath);
    }

    async moveToTemporary(relativeSubPath: string): Promise<void> {
        const absolutePath = this.getSafePath(relativeSubPath);
        
        await fs.mkdir(this.temporaryPath, { recursive: true });

        const filename = path.basename(absolutePath);
        const timestamp = new Date().getTime();
        const trashFilename = `${timestamp}_${filename}`;
        const targetPath = path.join(this.temporaryPath, trashFilename);

        await fs.rename(absolutePath, targetPath);
    }

    async browseTemporary(options?: BrowseOptions): Promise<BrowseResponse> {
        await fs.mkdir(this.temporaryPath, { recursive: true });
        
        // Temporarily change mountPath to temporaryPath to use browseInternal
        const originalMountPath = (this as any).mountPath;
        (this as any).mountPath = this.temporaryPath;
        try {
            return await this.browse('/', options);
        } finally {
            (this as any).mountPath = originalMountPath;
        }
    }

    async clearTemporary(): Promise<void> {
        const entries = await fs.readdir(this.temporaryPath, { withFileTypes: true });
        for (const entry of entries) {
            const entryPath = path.join(this.temporaryPath, entry.name);
            if (entry.isDirectory()) {
                await fs.rm(entryPath, { recursive: true, force: true });
            } else {
                await fs.unlink(entryPath);
            }
        }
    }

    private async getDirSize(directory: string): Promise<number> {
        const entries = await fs.readdir(directory, { withFileTypes: true });
        const sizes = await Promise.all(entries.map(async (entry) => {
            const entryPath = path.join(directory, entry.name);
            if (entry.isDirectory()) {
                return await this.getDirSize(entryPath);
            } else {
                const stats = await fs.stat(entryPath);
                return stats.size;
            }
        }));
        return sizes.reduce((acc, size) => acc + size, 0);
    }

    private getSafePath(relativeSubPath: string): string {
        // 1. Zabezpieczenie przed ".." przed resolve
        if (relativeSubPath.includes('..')) {
            throw new Error(`Directory traversal attempt detected: path contains ".."`);
        }

        // 2. Normalizacja ścieżki i usuwanie początkowych separatorów (obu rodzajów)
        let trimmedPath = relativeSubPath;
        while (trimmedPath.startsWith('/') || trimmedPath.startsWith('\\')) {
            trimmedPath = trimmedPath.substring(1);
        }

        const absolutePath = path.resolve(this.mountPath, trimmedPath);

        // 3. Sprawdzenie czy wynikowa ścieżka nadal znajduje się wewnątrz mountPath
        const mountPathWithSep = this.mountPath.endsWith(path.sep) ? this.mountPath : this.mountPath + path.sep;

        if (!absolutePath.startsWith(mountPathWithSep) && absolutePath !== this.mountPath) {
            throw new Error(`Directory traversal attempt detected: ${absolutePath} is outside ${this.mountPath}`);
        }

        return absolutePath;
    }
}
