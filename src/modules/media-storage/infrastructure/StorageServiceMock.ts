import { Readable } from 'stream';
import {StorageService} from "../domain/StorageService";
import {BrowseItem} from "../domain/dto/BrowseItem";
import {BrowseOptions, BrowseResponse} from "../domain/dto/BrowseOptions";


export class StorageServiceMock implements StorageService {

    async getStatus() {
        return {
            isAvailable: true,
            mountPath: '/mock/usb',
        };
    }

    async browse(path: string, options?: BrowseOptions): Promise<BrowseResponse> {
        const items: BrowseItem[] = [
            { name: 'photos', path: '/photos', type: 'directory', modifiedAt: new Date() },
            { name: 'cat.jpg', path: '/photos/cat.jpg', type: 'file', size: 123456, mimeType: 'image/jpeg', modifiedAt: new Date() },
        ];
        return {
            items,
            total: items.length,
            page: options?.page || 1,
            limit: options?.limit || 10,
        };
    }

    async getFileStream(path: string) {
        return {
            stream: Readable.from('mock file content'),
            mimeType: 'text/plain',
            size: 17,
        };
    }

    async getImportUsage() {
        return {
            used: 12 * 1024 * 1024 * 1024,
            max: 100 * 1024 * 1024 * 1024,
        };
    }

    async uploadToImport(): Promise<void> {
        return;
    }

    async deleteFromImport(): Promise<void> {
        return;
    }
}
