import WebSocket from "ws";
import {getCognitoAccessToken} from "./cognitoAuth.js";

const LOG_PREFIX = `API_GATEWAY_WS:`

const WEBSOCKET_API_URL = 'wss://dh50useqij.execute-api.eu-central-1.amazonaws.com/test/';
const PING_INTERVAL = 5 * 60 * 1000;

export function connectAwsWebSocket(twitchUsername) {
    try {
        const token = getCognitoAccessToken();

        const ws = new WebSocket(`${WEBSOCKET_API_URL}?token=${token}`);
        ws.on('open', () => {
            console.log(`${LOG_PREFIX} Connected, creating connection for streamer name: ${twitchUsername}`);
            const message = JSON.stringify({
                action: 'registerConnection',
                streamer_name: twitchUsername,
            });
            ws.send(message);

            // regularly send ping message to maintain connection with AWS
            const interval = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    console.log(`${LOG_PREFIX} Sending ping`);
                    ws.send(JSON.stringify({ action: 'ping' }));
                }
            }, PING_INTERVAL);

        });

        ws.on('message', (message) => {
            let data;

            try {
                data = JSON.parse(message.toString());
                console.log(`${LOG_PREFIX} Received message:`, data);

            } catch (error) {
                console.log(`${LOG_PREFIX} Received message:`, message.toString());
            }
        });

        ws.on('close', () => {
            console.log(`${LOG_PREFIX} Disconnected`);
        });

        ws.on('error', (error) => {
            console.error(`${LOG_PREFIX} error:`, error);
        });

        return ws;

    } catch (error) {
        console.error(`${LOG_PREFIX} Failed to connect to AWS WebSocket:`, error);
    }
}
