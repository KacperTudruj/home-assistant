import fs from 'fs/promises';
import path from 'path';
import { Readable } from 'stream';
import { createReadStream } from 'fs';
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

    async getFileStream(relativeSubPath: string): Promise<NodeJS.ReadableStream> {
        const absolutePath = this.getSafePath(relativeSubPath);
        const stats = await fs.stat(absolutePath);
        
        if (stats.isDirectory()) {
            throw new Error('Cannot stream a directory');
        }

        return createReadStream(absolutePath);
    }

    async getImportUsage() {
        // Placeholder for Etap 3
        return {
            used: 0,
            max: 100 * 1024 * 1024 * 1024,
        };
    }

    async uploadToImport(file: UploadFileInput): Promise<void> {
        // Placeholder for Etap 3
        throw new Error('Not implemented yet');
    }

    async deleteFromImport(relativeSubPath: string): Promise<void> {
        // Placeholder for Etap 3
        throw new Error('Not implemented yet');
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
