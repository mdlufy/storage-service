import fs from "fs";
import md5 from "md5";
import { Message, MessageType, UploadData } from "./../server";
import * as WebSocket from "ws";

export function saveChunk(payload: UploadData, ws: WebSocket, req): void {
    const { data, fileName, totalChunks, chunkIndex }: UploadData = payload;

    const [ext] = fileName.split(".").reverse();
    const [_, binaryData] = data.split(",");

    const buffer = Buffer.from(binaryData, "base64");
    const tmpFilename =
        "tmp_" + md5(fileName + req.socket.remoteAddress) + "." + ext;

    if (chunkIndex === 0 && fs.existsSync("./uploads/" + tmpFilename)) {
        fs.unlinkSync("./uploads/" + tmpFilename);
    }

    fs.appendFileSync("./uploads/" + tmpFilename, buffer);

    if (!(chunkIndex === totalChunks - 1)) {
        return;
    }

    const finalFileName = md5([Date.now()]).slice(0, 6) + "." + ext;

    fs.renameSync("./uploads/" + tmpFilename, "./uploads/" + finalFileName);

    const successUploadMessage: Message = {
        type: MessageType.FINISH_UPLOAD,
        payload: {
            finalFileName,
        },
    };

    ws.send(JSON.stringify(successUploadMessage));
}
