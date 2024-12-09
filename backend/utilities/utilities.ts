import {DateTime} from "luxon";
import {WebSocket} from "ws";

export const createTimestamp = (): string => {
    const now = DateTime.now().toUTC()
    return now.toFormat("yyyy-LL-dd'T'HH:mm:ssZZ");
}

export const createTimestampWithoutDate = (): string => {
    const now = DateTime.now()
    return now.toFormat("HH:mm:ss")
}

export function waitForWebSocketClose(ws: WebSocket, closeHandler: () => Promise<void>): Promise<void> {
    ws.removeAllListeners('close');

    return new Promise((resolve, reject) => {
        ws.once('close', async () => {
            try {
                await closeHandler();
                resolve();
            } catch (error) {
                reject(error);
            }
        });
        ws.close();
    });
}
