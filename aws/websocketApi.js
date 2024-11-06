import WebSocket from "ws";
import {getAccessToken} from "./cognitoAuth.js";

const WEBSOCKET_API_URL = 'wss://dh50useqij.execute-api.eu-central-1.amazonaws.com/test/';
const PING_INTERVAL = 5 * 60 * 1000;

export async function connectAwsWebSocket(twitchUsername) {
    try {
        const token = getAccessToken();

        const ws = new WebSocket(`${WEBSOCKET_API_URL}?token=${token}`);
        ws.on('open', () => {
            console.log(`AWS Websocket: Connected, creating connection for streamer name: ${twitchUsername}`);
            const message = JSON.stringify({
                action: 'registerConnection',
                streamer_name: twitchUsername,
            });
            ws.send(message);

            // regularly send ping message to maintain connection with AWS
            const interval = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    console.log('Sending ping to WebsocketApi');
                    ws.send(JSON.stringify({ action: 'ping' }));
                }
            }, PING_INTERVAL);

        });

        ws.on('message', (message) => {
            let data;

            try {
                data = JSON.parse(message.toString());
                console.log('Received message from WebsocketApi:', data);

            } catch (error) {
                console.log('Received message from WebsocketApi:', message.toString());
            }
        });

        ws.on('close', () => {
            console.log('AWS Websocket: Disconnected');
        });

        ws.on('error', (error) => {
            console.error('AWS Websocket: error:', error);
        });

        return ws;

    } catch (error) {
        console.error('Failed to connect to AWS WebSocket:', error);
    }
}
