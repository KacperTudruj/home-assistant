export type BrowseItem = {
    name: string;
    path: string;
    type: 'file' | 'directory';
    size?: number;
};
