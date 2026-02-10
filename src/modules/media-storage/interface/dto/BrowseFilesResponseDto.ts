export interface BrowseFilesResponseDto {
    name: string;
    path: string;
    type: 'file' | 'directory';
    size?: number;
}
