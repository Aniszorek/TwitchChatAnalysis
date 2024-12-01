import WebSocket from "ws";
import {frontendClients, sendMessageToFrontendClient} from "../bot/wsServer";

const LOG_PREFIX = `API_GATEWAY_WS:`

const WEBSOCKET_API_URL = 'wss://dh50useqij.execute-api.eu-central-1.amazonaws.com/test/';
const PING_INTERVAL = 5 * 60 * 1000;

const NLP_MESSAGE_WEBSOCKET_TYPE = "nlp_processed_message"

interface RegisterConnectionMessage {
    action: "registerConnection";
    streamer_name: string;
}

interface WebSocketMessage {
    type?: string;
    data?: unknown;
}

export function connectAwsWebSocket(twitchUsername: string, cognitoUserId: string): WebSocket | null {
    try {
        const cognitoData = frontendClients.get(cognitoUserId)?.cognito;

        if (!cognitoData?.cognitoIdToken) {
            console.error(`${LOG_PREFIX} Missing Cognito ID token for user: ${cognitoUserId}`);
            return null;
        }
        const awsWebSocket = new WebSocket(`${WEBSOCKET_API_URL}?token=${cognitoData.cognitoIdToken}`);

        awsWebSocket.on('open', () => {
            console.log(`${LOG_PREFIX} Connected, creating connection for streamer name: ${twitchUsername}`);

            const registerMessage: RegisterConnectionMessage = {
                action: "registerConnection",
                streamer_name: twitchUsername,
            };
            awsWebSocket.send(JSON.stringify(registerMessage));

            // regularly send ping message to maintain connection with AWS
            const interval = setInterval(() => {
                if (awsWebSocket.readyState === WebSocket.OPEN) {
                    console.log(`${LOG_PREFIX} Sending ping`);
                    awsWebSocket.send(JSON.stringify({ action: 'ping' }));
                } else {
                    clearInterval(interval);
                }
            }, PING_INTERVAL);

        });

        awsWebSocket.on("message", (message: WebSocket.Data) => {
            try {
                const data: WebSocketMessage = JSON.parse(message.toString());
                console.log(`${LOG_PREFIX} Received message:`, data);

                if (data.type === NLP_MESSAGE_WEBSOCKET_TYPE && data.data) {
                    //TODO handle processed messages on FE
                    sendMessageToFrontendClient(cognitoUserId, data.data);
                    console.log(`${LOG_PREFIX} Message sent to frontend client`);
                }
            } catch (error) {
                console.log(`${LOG_PREFIX} Received message:`, message.toString());
            }
        });

        awsWebSocket.on("close", () => {
            console.log(`${LOG_PREFIX} Disconnected from AWS WebSocket`);
        });

        awsWebSocket.on("error", (error: Error) => {
            console.error(`${LOG_PREFIX} WebSocket error:`, error);
        });

        return awsWebSocket;

    } catch (error) {
        console.error(`${LOG_PREFIX} Failed to connect to AWS WebSocket:`, error);
        return null;
    }
}
