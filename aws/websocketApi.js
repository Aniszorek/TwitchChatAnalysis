import WebSocket from "ws";
import {getAccessToken} from "./cognitoAuth.js";

const WEBSOCKET_API_URL = 'wss://dh50useqij.execute-api.eu-central-1.amazonaws.com/test/';

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
        });

        ws.on('message', (data) => {
            const message = data.toString();
            console.log('AWS Websocket: Received:', message);// TODO dodac obsluge odczytu wiadomosci
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
