import WebSocket from "ws";
import {frontendClients, incrementSentimentMessageCount, SentimentLabel} from "../bot/frontendClients";
import {checkReadinessAndNotifyFrontend, sendMessageToFrontendClient} from "../bot/wsServer";
import {LogColor, logger, LogStyle} from "../utilities/logger";
import {IS_DEBUG_ENABLED} from "../entryPoint";

const LOG_PREFIX = `API_GATEWAY_WS`

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
            logger.error(`Missing Cognito ID token for user: ${cognitoUserId}`, LOG_PREFIX, {style: LogStyle.BOLD});
            return null;
        }
        const awsWebSocket = new WebSocket(`${WEBSOCKET_API_URL}?token=${cognitoData.cognitoIdToken}`);

        awsWebSocket.on('open', () => {
            logger.info(`Connected, creating connection for streamer name: ${twitchUsername}`, LOG_PREFIX, {color: LogColor.YELLOW});

            const registerMessage: RegisterConnectionMessage = {
                action: "registerConnection",
                streamer_name: twitchUsername,
            };
            awsWebSocket.send(JSON.stringify(registerMessage));

            // regularly send ping message to maintain connection with AWS
            const interval = setInterval(() => {
                if (awsWebSocket.readyState === WebSocket.OPEN) {
                    logger.info(`Sending ping`, LOG_PREFIX, {color: LogColor.YELLOW});
                    awsWebSocket.send(JSON.stringify({ action: 'ping' }));
                } else {
                    clearInterval(interval);
                }
            }, PING_INTERVAL);
            const client = frontendClients.get(cognitoUserId);
            if (client) {
                client.readiness.awsReady = true;
                checkReadinessAndNotifyFrontend(cognitoUserId);
            }
        });

        awsWebSocket.on("message", (message: WebSocket.Data) => {
            try {
                const data: WebSocketMessage = JSON.parse(message.toString());
                logger.info(`Received message: ${IS_DEBUG_ENABLED ? JSON.stringify(data, null, 2) : ""}`,LOG_PREFIX, {color: LogColor.YELLOW, style: LogStyle.BOLD});

                if (data.type === NLP_MESSAGE_WEBSOCKET_TYPE && data.data) {
                    //TODO handle processed messages on FE
                    sendMessageToFrontendClient(cognitoUserId, data.data);

                    const nlpClassification = (data.data as any)?.nlp_classification;
                    const convertedNlpClassification = Object.values(SentimentLabel).includes(nlpClassification as SentimentLabel) ? nlpClassification as SentimentLabel : undefined;
                    if (convertedNlpClassification == undefined) {
                        logger.error("Converted NLP Classification is undefined", LOG_PREFIX);
                    }
                    else{
                        incrementSentimentMessageCount(cognitoUserId, convertedNlpClassification);
                    }

                    logger.info(`Message sent to frontend client`, LOG_PREFIX, {color: LogColor.YELLOW});
                }
            } catch (error) {
                logger.info(`Received message: ${message.toString()}`, LOG_PREFIX, {color: LogColor.YELLOW, style: LogStyle.BOLD});
            }
        });

        awsWebSocket.on("close", () => {
            logger.info(`Disconnected from AWS WebSocket`, LOG_PREFIX, {color: LogColor.YELLOW});
        });

        awsWebSocket.on("error", (error: Error) => {
            logger.error(`WebSocket error: ${error}`, LOG_PREFIX);
        });

        return awsWebSocket;

    } catch (error: any) {
        logger.error(`Failed to connect to AWS WebSocket: ${error.message}`, LOG_PREFIX);
        return null;
    }
}
