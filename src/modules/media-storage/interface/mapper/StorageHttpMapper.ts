export class StorageHttpMapper {

    static toStatusDto(status: any) {
        return {
            isAvailable: status.isAvailable,
            mountPath: status.mountPath,
        };
    }

    static toBrowseDto(files: any[]) {
        return files.map(f => ({
            name: f.name,
            path: f.path,
            type: f.type,
            size: f.size,
        }));
    }

    static toImportUsageDto(usage: any) {
        return {
            usedBytes: usage.used,
            maxBytes: usage.max,
        };
    }
}
