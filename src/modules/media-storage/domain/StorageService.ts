import {UploadFileInput} from "./dto/UploadFileInput";
import {BrowseItem} from "./dto/BrowseItem";

export interface StorageService {
    getStatus(): Promise<{
        isAvailable: boolean;
        mountPath: string;
    }>;

    browse(path: string): Promise<BrowseItem[]>;

    getFileStream(path: string): Promise<NodeJS.ReadableStream>;

    getImportUsage(): Promise<{
        used: number;
        max: number;
    }>;

    uploadToImport(file: UploadFileInput): Promise<void>;

    deleteFromImport(path: string): Promise<void>;
}
