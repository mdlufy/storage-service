import fs from "fs";
import md5 from "md5";
import * as WebSocket from "ws";
import {
    RequestUploadFile,
    SocketMessage,
    SocketMessageType,
    SuccessUploadFile,
    UploadFile,
} from "../server";

export function saveFileChunk(
    payload: UploadFile,
    ws: WebSocket,
    req: RequestUploadFile
): void {
    const encodedFilename = req.params.file;
    const fileName = decodeURIComponent(encodedFilename);
    const [ext] = fileName.split(".").reverse();

    const { data, totalChunks, chunkIndex }: UploadFile = payload;

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

    const finalFileName = md5(fileName) + "." + ext;

    fs.renameSync("./uploads/" + tmpFilename, "./uploads/" + finalFileName);

    const successUploadSocketMessage: SocketMessage<SuccessUploadFile> = {
        type: SocketMessageType.FINISH_UPLOAD,
        payload: {
            finalFileName,
        },
    };

    ws.send(JSON.stringify(successUploadSocketMessage));
}
