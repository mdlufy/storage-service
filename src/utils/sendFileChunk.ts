import { Request } from 'express';
import fs from 'fs';
import md5 from 'md5';
import * as WebSocket from 'ws';
import { DownloadFile } from '../contracts/download-file';
import { SocketMessage, SocketMessageType } from '../contracts/socket-message';

const CHUNK_SIZE: number = 15 * 1e3;

export function sendFileChunk(ws: WebSocket, req: Request): void {
    const encodedFilename = req.params.file;
    const fileName = decodeURIComponent(encodedFilename);

    const [ext] = fileName.split('.').reverse();
    const hashedFileName = md5(fileName) + '.' + ext;

    const filePath = './uploads/' + hashedFileName;

    if (!fs.existsSync(filePath)) {
        return;
    }

    const file = fs.readFileSync(filePath);

    const totalChunks = Math.ceil(file.length / CHUNK_SIZE);

    for (
        let bytesRead = 0;
        bytesRead < file.length;
        bytesRead = bytesRead + CHUNK_SIZE
    ) {
        const buffer = file.subarray(bytesRead, bytesRead + CHUNK_SIZE);

        const payload: DownloadFile = {
            data: buffer,
            fileSize: file.length,
            chunkIndex: bytesRead / CHUNK_SIZE + 1,
            totalChunks,
        };

        const message: SocketMessage<DownloadFile> = {
            type: SocketMessageType.DATA,
            payload,
        };

        ws.send(JSON.stringify(message));
    }
}

// export async function startFileDownload(ws, filename) {
//   const fileStream = fs.createReadStream(filename);

//   await sendFileChunk(ws, fileStream, 0);
// }

// async function sendFileChunk(ws, fileStream, offset = 0) {
//   const buffer = Buffer.alloc(CHUNK_SIZE);

//   const bytesRead = await fileStream.read(buffer, 0, CHUNK_SIZE, offset);

//   if (bytesRead === 0) {
//         const payload: DownloadFile = {
//             data: buffer,
//             chunkIndex: (bytesRead / CHUNK_SIZE) + 1,
//             totalChunks,
//         };

//         const message: SocketMessage<DownloadFile> = {
//             type: SocketMessageType.DATA,
//             payload,
//         };

//         ws.send(JSON.stringify(message));
//     ws.send(JSON.stringify({ action: 'part', done: true }));
//   } else {
//     ws.send(JSON.stringify({ action: 'part', part: buffer.slice(0, bytesRead), offset: offset, done: false }));

//     sendFileChunk(ws, fileStream, offset + buffer.slice(0, bytesRead).length);
//   }
// }
