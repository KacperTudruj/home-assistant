export interface BrowseOptions {
    sortBy?: 'name' | 'size' | 'modifiedAt';
    sortOrder?: 'asc' | 'desc';
    filter?: string; // name filter
    type?: 'file' | 'directory';
    page?: number;
    limit?: number;
}

export interface BrowseResponse {
    items: import('./BrowseItem').BrowseItem[];
    total: number;
    page: number;
    limit: number;
}
