export interface UploadFileInput {
    filename: string;
    mimeType: string;
    size: number;
    stream: NodeJS.ReadableStream;
}
