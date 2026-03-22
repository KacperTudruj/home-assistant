import fs from 'fs/promises';
import path from 'path';
import mime from 'mime';
import { Readable, pipeline } from 'stream';
import { promisify } from 'util';
import { createReadStream, createWriteStream } from 'fs';
import { StorageService } from "../domain/StorageService";
import { BrowseItem } from "../domain/dto/BrowseItem";
import { UploadFileInput } from "../domain/dto/UploadFileInput";

export class DiskStorageService implements StorageService {
    private readonly mountPath: string;

    constructor(mountPath: string) {
        this.mountPath = path.resolve(mountPath);
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

    async browse(relativeSubPath: string): Promise<BrowseItem[]> {
        const absolutePath = this.getSafePath(relativeSubPath);
        
        try {
            const entries = await fs.readdir(absolutePath, { withFileTypes: true });
            
            const items = await Promise.all(entries.map(async (entry) => {
                const entryPath = path.join(absolutePath, entry.name);
                const relativeEntryPath = path.relative(this.mountPath, entryPath).replace(/\\/g, '/');
                const prefixedPath = relativeEntryPath.startsWith('/') ? relativeEntryPath : '/' + relativeEntryPath;

                if (entry.isDirectory()) {
                    return {
                        name: entry.name,
                        path: prefixedPath,
                        type: 'directory' as const,
                    };
                } else {
                    const stats = await fs.stat(entryPath);
                    return {
                        name: entry.name,
                        path: prefixedPath,
                        type: 'file' as const,
                        size: stats.size,
                    };
                }
            }));

            return items;
        } catch (error) {
            if ((error as any).code === 'ENOENT') {
                return [];
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
        const absolutePath = this.getSafePath(relativeSubPath);
        const importPath = path.resolve(this.mountPath, 'import');

        if (!absolutePath.startsWith(importPath)) {
            throw new Error('Can only delete from import folder');
        }

        const stats = await fs.stat(absolutePath);
        if (stats.isDirectory()) {
            throw new Error('Cannot delete directory');
        }

        await fs.unlink(absolutePath);
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

        const normalizedSubPath = path.normalize(relativeSubPath);
        const trimmedPath = (normalizedSubPath.startsWith(path.sep) || normalizedSubPath.startsWith('/')) 
            ? normalizedSubPath.substring(1) 
            : normalizedSubPath;
            
        const absolutePath = path.resolve(this.mountPath, trimmedPath);

        const mountPathWithSep = this.mountPath.endsWith(path.sep) ? this.mountPath : this.mountPath + path.sep;

        if (!absolutePath.startsWith(mountPathWithSep) && absolutePath !== this.mountPath) {
            throw new Error(`Directory traversal attempt detected: ${absolutePath} is outside ${this.mountPath}`);
        }

        return absolutePath;
    }
}
