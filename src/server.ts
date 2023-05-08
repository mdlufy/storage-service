import cors from "cors";
import fs from "fs";
import md5 from "md5";
import express from 'express';
import expressWs from 'express-ws';
import * as WebSocket from 'ws';

export interface MessageData {
    data: string | null | undefined
    fileName: string | undefined,
    fileSize: number | undefined,
    totalChunks: number,
    chunkIndex: number,
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

app.ws('/upload-file', (ws: WebSocket, req) => {
    ws.on('message', (message: string) => {
        const messageData: MessageData = JSON.parse(message);
        console.log(messageData);

        const { data, fileName, fileSize, totalChunks, chunkIndex } = messageData;

        const firstChunk = chunkIndex === 0;
        const lastChunk = chunkIndex === totalChunks - 1;

        const [ext] = fileName.split(".").reverse();
        const [_, binaryData] = data.split(",");

        const buffer = Buffer.from(binaryData, "base64");
        const tmpFilename = "tmp_" + md5(fileName + req.socket.remoteAddress) + "." + ext;

        if (firstChunk && fs.existsSync("./uploads/" + tmpFilename)) {
            fs.unlinkSync("./uploads/" + tmpFilename);
        }

        fs.appendFileSync("./uploads/" + tmpFilename, buffer);

        if (!lastChunk) {
            // ws.send("OK");

            return;
        }

        const finalFilename = md5([Date.now()]).slice(0, 6) + "." + ext;

        fs.renameSync("./uploads/" + tmpFilename, "./uploads/" + finalFilename);

        ws.send(finalFilename);
    });


    ws.send('Success started WS server');

    ws.on('close', () => {
        console.log('WebSocket was closed');
    });
})

app.listen(process.env.PORT || 8999);
