import { createClient, WebDAVClient, FileStat } from "webdav";
import { StorageService } from "../domain/StorageService";
import { BrowseResponse } from "../domain/dto/BrowseOptions";
import { UploadFileInput } from "../domain/dto/UploadFileInput";
import { Readable, PassThrough } from "stream";
import mime from "mime";
import path from "path";

export class NextcloudStorageService implements StorageService {
    private client: WebDAVClient;
    private readonly remoteRoot: string;

    constructor(url: string, username: string, password: string, remoteRoot: string = "/remote.php/dav/files/admin/") {
        this.client = createClient(url, {
            username,
            password
        });
        this.remoteRoot = remoteRoot;
    }

    private getFullRemotePath(relativePath: string): string {
        // Ensure relativePath starts without a leading slash if remoteRoot ends with one
        const cleanedRelative = relativePath.startsWith("/") ? relativePath.substring(1) : relativePath;
        return path.posix.join(this.remoteRoot, cleanedRelative);
    }

    async getStatus() {
        try {
            // Check if we can list the root
            const contents = await this.client.getDirectoryContents(this.remoteRoot);
            console.log(`Nextcloud WebDAV root check success: ${Array.isArray(contents) ? contents.length : 'ok'} items`);
            return {
                isAvailable: true,
                mountPath: "Nextcloud: " + this.remoteRoot,
            };
        } catch (error: any) {
            console.error("Nextcloud status error:", {
                message: error.message,
                status: error.status,
                statusText: error.statusText,
                url: this.remoteRoot
            });
            return {
                isAvailable: false,
                mountPath: "Nextcloud: " + this.remoteRoot,
            };
        }
    }

    async browse(relativePath: string, options?: any): Promise<BrowseResponse> {
        const fullPath = this.getFullRemotePath(relativePath);
        try {
            const contents = await this.client.getDirectoryContents(fullPath) as FileStat[];
            
            let items = contents.map(item => {
                // Nextcloud paths are absolute in WebDAV, we want them relative to our "root"
                const itemRelativePath = item.filename.replace(this.remoteRoot, "");
                const normalizedPath = itemRelativePath.startsWith("/") ? itemRelativePath : "/" + itemRelativePath;

                return {
                    name: item.basename,
                    path: normalizedPath,
                    type: item.type === "directory" ? "directory" as const : "file" as const,
                    size: item.size,
                    modifiedAt: new Date(item.lastmod),
                    mimeType: item.mime || (item.type === "file" ? mime.getType(item.basename) || "application/octet-stream" : undefined)
                };
            });

            // Basic filtering for hidden files
            items = items.filter(i => !i.name.startsWith('.') && !i.name.startsWith('$'));

            return {
                items,
                total: items.length,
                page: options?.page || 1,
                limit: options?.limit || items.length
            };
        } catch (error) {
            console.error(`Nextcloud browse error for ${relativePath}:`, error);
            throw error;
        }
    }

    async getFileStream(relativePath: string) {
        const fullPath = this.getFullRemotePath(relativePath);
        const stream = this.client.createReadStream(fullPath);
        const stat = await this.client.stat(fullPath) as FileStat;

        return {
            stream: stream as unknown as NodeJS.ReadableStream,
            mimeType: stat.mime || mime.getType(fullPath) || "application/octet-stream",
            size: stat.size
        };
    }

    async getThumbnailStream(relativePath: string) {
        // Nextcloud has a thumbnail API, but it's separate from WebDAV.
        // For now, let's just return the full file stream as a fallback 
        // or we could implement the Nextcloud thumbnail API call.
        // The original DiskStorageService used sharp/ffmpeg.
        return this.getFileStream(relativePath);
    }

    async getImportUsage() {
        // Nextcloud quota can be retrieved via OCS API or PROPFIND on the root.
        // For simplicity, let's return a mock or implement PROPFIND.
        return {
            used: 0,
            max: 100 * 1024 * 1024 * 1024 // 100 GB
        };
    }

    async uploadToImport(file: UploadFileInput): Promise<void> {
        const remotePath = this.getFullRemotePath(path.posix.join("import", file.filename));
        
        // Ensure import directory exists
        const importDir = this.getFullRemotePath("import");
        if (!await this.client.exists(importDir)) {
            await this.client.createDirectory(importDir);
        }

        // Use readable stream directly if possible, or convert to Buffer if necessary
        // WebDAV client's putFileContents supports Buffer, string, or ReadableStream
        await this.client.putFileContents(remotePath, file.stream as any);
    }

    async deleteFromImport(relativePath: string): Promise<void> {
        const fullPath = this.getFullRemotePath(relativePath);
        await this.client.deleteFile(fullPath);
    }

    async moveToTemporary(relativePath: string): Promise<void> {
        const sourcePath = this.getFullRemotePath(relativePath);
        const destPath = this.getFullRemotePath(path.posix.join("temporary", path.basename(relativePath)));

        // Ensure temporary directory exists
        const tempDir = this.getFullRemotePath("temporary");
        if (!await this.client.exists(tempDir)) {
            await this.client.createDirectory(tempDir);
        }

        await this.client.moveFile(sourcePath, destPath);
    }

    async browseTemporary(options?: any): Promise<BrowseResponse> {
        return this.browse("/temporary", options);
    }

    async clearTemporary(): Promise<void> {
        const tempDir = this.getFullRemotePath("temporary");
        if (await this.client.exists(tempDir)) {
            await this.client.deleteFile(tempDir);
            await this.client.createDirectory(tempDir);
        }
    }
}
