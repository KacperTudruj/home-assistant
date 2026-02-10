import { Readable } from 'stream';
import {StorageService} from "../domain/StorageService";
import {BrowseItem} from "../domain/dto/BrowseItem";


export class StorageServiceMock implements StorageService {

    async getStatus() {
        return {
            isAvailable: true,
            mountPath: '/mock/usb',
        };
    }

    async browse(path: string): Promise<BrowseItem[]> {
        return [
            { name: 'photos', path: '/photos', type: 'directory' },
            { name: 'cat.jpg', path: '/photos/cat.jpg', type: 'file', size: 123456 },
        ];
    }

    async getFileStream() {
        return Readable.from('mock file content');
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
