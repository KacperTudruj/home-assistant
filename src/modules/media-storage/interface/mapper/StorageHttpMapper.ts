export class StorageHttpMapper {

    static toStatusDto(status: any) {
        return {
            isAvailable: status.isAvailable,
            mountPath: status.mountPath,
        };
    }

    static toBrowseDto(response: any) {
        return {
            items: response.items.map((f: any) => ({
                name: f.name,
                path: f.path,
                type: f.type,
                size: f.size,
                mimeType: f.mimeType,
                modifiedAt: f.modifiedAt,
            })),
            total: response.total,
            page: response.page,
            limit: response.limit,
        };
    }

    static toImportUsageDto(usage: any) {
        return {
            usedBytes: usage.used,
            maxBytes: usage.max,
        };
    }
}
