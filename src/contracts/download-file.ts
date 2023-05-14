export interface DownloadFile {
    data: Buffer;
    fileSize: number;
    totalChunks: number;
    chunkIndex: number;
}
