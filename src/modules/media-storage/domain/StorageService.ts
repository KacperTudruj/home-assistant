import {UploadFileInput} from "./dto/UploadFileInput";
import {BrowseItem} from "./dto/BrowseItem";
import {BrowseOptions, BrowseResponse} from "./dto/BrowseOptions";

export interface StorageService {
    getStatus(): Promise<{
        isAvailable: boolean;
        mountPath: string;
    }>;

    browse(path: string, options?: BrowseOptions): Promise<BrowseResponse>;

    getFileStream(path: string): Promise<{
        stream: NodeJS.ReadableStream;
        mimeType: string;
        size: number;
    }>;

    getThumbnailStream(path: string): Promise<{
        stream: NodeJS.ReadableStream;
        mimeType: string;
        size: number;
    }>;

    getImportUsage(): Promise<{
        used: number;
        max: number;
    }>;

    uploadToImport(file: UploadFileInput): Promise<void>;

    deleteFromImport(path: string): Promise<void>;
    moveToTemporary(path: string): Promise<void>;
    browseTemporary(options?: BrowseOptions): Promise<BrowseResponse>;
    clearTemporary(): Promise<void>;
}
