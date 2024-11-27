import WebSocket from "ws";

const LOG_PREFIX = `API_GATEWAY_WS:`

const WEBSOCKET_API_URL = 'wss://dh50useqij.execute-api.eu-central-1.amazonaws.com/test/';
const PING_INTERVAL = 5 * 60 * 1000;

const NLP_MESSAGE_WEBSOCKET_TYPE = "nlp_processed_message"

export function connectAwsWebSocket(twitchUsername, cognitoIdToken, cognitoUserId) {
    try {
        const awsWebSocket = new WebSocket(`${WEBSOCKET_API_URL}?token=${cognitoIdToken}`);
        awsWebSocket.on('open', () => {
            console.log(`${LOG_PREFIX} Connected, creating connection for streamer name: ${twitchUsername}`);
            const message = JSON.stringify({
                action: 'registerConnection',
                streamer_name: twitchUsername,
            });
            awsWebSocket.send(message);

            // regularly send ping message to maintain connection with AWS
            const interval = setInterval(() => {
                if (awsWebSocket.readyState === WebSocket.OPEN) {
                    console.log(`${LOG_PREFIX} Sending ping`);
                    awsWebSocket.send(JSON.stringify({ action: 'ping' }));
                }
            }, PING_INTERVAL);

        });

        awsWebSocket.on('message', (message) => {
            let data;

            try {
                data = JSON.parse(message.toString());
                console.log(`${LOG_PREFIX} Received message:`, data);

                if(data.type && data.data && data.type === NLP_MESSAGE_WEBSOCKET_TYPE){
                    //TODO poprawnie odczytywać przetworzoną wiadomość na FE
                    sendMessageToFrontendClient(cognitoUserId, data.data)
                }

            } catch (error) {
                console.log(`${LOG_PREFIX} Received message:`, message.toString());
            }
        });

        awsWebSocket.on('close', () => {
            console.log(`${LOG_PREFIX} Disconnected`);
        });

        awsWebSocket.on('error', (error) => {
            console.error(`${LOG_PREFIX} error:`, error);
        });

        return awsWebSocket;

    } catch (error) {
        console.error(`${LOG_PREFIX} Failed to connect to AWS WebSocket:`, error);
        return null;
    }
}
