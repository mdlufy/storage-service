import fs from "fs";
import md5 from "md5";
import { SocketMessage, SocketMessageType, UploadFile } from "./../server";
import * as WebSocket from "ws";

export function saveChunk(payload: UploadFile, ws: WebSocket, req): void {
    const { data, fileName, totalChunks, chunkIndex }: UploadFile = payload;

    const [ext] = fileName.split(".").reverse();
    const [binaryData] = data.split(",").reverse();

    const buffer = Buffer.from(binaryData, "base64");
    const tmpFilename =
        "tmp_" + md5(fileName + req.socket.remoteAddress) + "." + ext;

    if (chunkIndex === 1 && fs.existsSync("./uploads/" + tmpFilename)) {
        fs.unlinkSync("./uploads/" + tmpFilename);
    }

    fs.appendFileSync("./uploads/" + tmpFilename, buffer);

    if (!(chunkIndex === totalChunks)) {
        return;
    }

    const finalFileName = md5([Date.now()]).slice(0, 6) + "." + ext;

    fs.renameSync("./uploads/" + tmpFilename, "./uploads/" + finalFileName);

    const successUploadSocketMessage: SocketMessage = {
        type: SocketMessageType.FINISH_UPLOAD,
        payload: {
            finalFileName,
        },
    };

    ws.send(JSON.stringify(successUploadSocketMessage));
}
