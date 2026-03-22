import fs from 'fs/promises';
import path from 'path';
import mime from 'mime';
import { Readable, pipeline } from 'stream';
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
            
            let items: BrowseItem[] = await Promise.all(entries.map(async (entry) => {
                const entryPath = path.join(absolutePath, entry.name);
                
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
            }));

            // Filter system/hidden files/folders and temporary storage
            items = items.filter(i => {
                const itemAbsPath = path.resolve(absolutePath, i.name);
                

                const isSystem = i.name.startsWith('$') || i.name.startsWith('.');

                const isTemporary = itemAbsPath === this.temporaryPath;
                
                return !isSystem && !isTemporary;
            });

            // Filtering
            if (options?.filter) {
                const filter = options.filter.toLowerCase();
                items = items.filter(i => i.name.toLowerCase().includes(filter));
            }
            if (options?.type) {
                items = items.filter(i => i.type === options.type);
            }

            // Sorting
            if (options?.sortBy) {
                const sortBy = options.sortBy;
                const sortOrder = options.sortOrder === 'desc' ? -1 : 1;
                items.sort((a, b) => {
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

            const total = items.length;
            const page = options?.page || 1;
            const limit = options?.limit || total || 100;
            const startIndex = (page - 1) * limit;
            const paginatedItems = items.slice(startIndex, startIndex + limit);

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
