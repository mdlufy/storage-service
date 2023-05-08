import cors from "cors";
import express from "express";
import expressWs from "express-ws";
import * as WebSocket from "ws";
import { saveChunk } from './utils/saveChunk';

export interface UploadData {
    data: string;
    fileName: string;
    fileSize: number;
    totalChunks: number;
    chunkIndex: number;
}

export interface Message {
    type: MessageType;
    payload?: Payload;
}

export interface SuccessUploadData {
    finalFileName: string;
}

export type Payload = UploadData | SuccessUploadData;

export enum MessageType {
    DATA = "Data",
    START_UPLOAD = "Start upload",
    FINISH_UPLOAD = "Finish upload",
    START_DOWNLOAD = "Start download",
    FINISH_DOWNLOAD = "Finish download",
}

const baseApp = express();
const wsInstance = expressWs(baseApp);
const app = wsInstance.app;

app.use(
    cors({
        origin: "http://localhost:3000",
    })
);
app.use("/uploads", express.static("uploads"));

app.ws("/upload", (ws: WebSocket, req) => {
    ws.on("message", (message: string) => {
        const { type, payload }: Message = JSON.parse(message);

        switch (type) {
            case MessageType.DATA:
                saveChunk(payload as UploadData, ws, req)
        }
    });

    ws.on("close", () => {
        console.log("WebSocket was closed");
    });
});

// app.ws("/download", (ws: WebSocket, req) => {
//     ws.on("message", (message: string) => {});
// });

app.listen(process.env.PORT || 8999);
