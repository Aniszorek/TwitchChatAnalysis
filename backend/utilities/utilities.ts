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
    keys: (keyof T)[],
    required: boolean = true
): T {
    return keys.reduce((acc, key) => {
        const value = req.query[String(key)] as string | undefined;
        if (!value && required) {
            throw new ErrorWithStatus(400, `Missing required param: ${String(key)}`);
        }
        if (value !== undefined) {
            acc[key] = value as T[keyof T];
        }
        return acc;
    }, {} as T);
}




export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function createHandlerWithContext(handler: Function) {
    return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            // This will unpack the context and pass it to the original handler
            const context = {
                queryParams: req.query, // Or any other context you want
                headers: req.headers,
                validatedBody: req.body, // Add validation here if necessary
            };

            // Call the original handler
            await handler(req, res, next, context);
        } catch (error) {
            next(error);
        }
    };
}

