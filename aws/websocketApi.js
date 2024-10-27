import WebSocket from "ws";
import {getAccessToken} from "./cognitoAuth.js";

const WEBSOCKET_API_URL = 'wss://dh50useqij.execute-api.eu-central-1.amazonaws.com/test/';

export async function connectAwsWebSocket() {
    try {
        const token = getAccessToken();

        const ws = new WebSocket(`${WEBSOCKET_API_URL}?token=${token}`);
        ws.on('open', () => {
            console.log("AWS Websocket: Connected");
            const message = JSON.stringify({
                action: 'registerConnection',
                streamer_name: 'example_streamer',   // TODO podmienic na wartosc z input fielda na FE
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
