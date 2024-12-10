import {DateTime} from "luxon";
import express from "express";
import {ErrorWithStatus} from "../routes/aws/awsTwitchMessageRouter";
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

export function extractHeaders<T extends Record<string, string | undefined>>(
    req: express.Request,
    requiredKeys: (keyof T)[]
): T {
    return requiredKeys.reduce((acc, key) => {
        const value = req.headers[String(key)] as string | undefined;
        if (!value) {
            throw new ErrorWithStatus(400, `Missing required header: ${String(key)}`);
        }
        acc[key] = value as T[keyof T];
        return acc;
    }, {} as T);
}


export function extractQueryParams<T extends Record<string, string | undefined>>(
    req: express.Request,
    requiredKeys: (keyof T)[]
): T {
    return requiredKeys.reduce((acc, key) => {
        const value = req.query[String(key)] as string | undefined;
        if (!value) {
            throw new ErrorWithStatus(400, `Missing required param: ${String(key)}`);
        }
        acc[key] = value as T[keyof T];
        return acc;
    }, {} as T);
}



