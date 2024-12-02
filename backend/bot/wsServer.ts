import {WebSocket, WebSocketServer} from 'ws';
import {verifyToken} from "../aws/cognitoAuth";
import { startTwitchWebSocket } from "./bot";
import {connectAwsWebSocket} from "../aws/websocketApi";
import {deleteTwitchSubscription} from "../twitch_calls/twitchAuth";
import {CLIENT_ID, TWITCH_BOT_OAUTH_TOKEN} from "../envConfig";
import {
    frontendClients,
    getFrontendClientTwitchStreamMetadata,
    setFrontendClientCognitoData,
    setFrontendClientTwitchData, setFrontendClientTwitchStreamMetadata, TwitchStreamMetadata
} from "./frontendClients";

const LOG_PREFIX = 'BACKEND WS:'

export const pendingWebSocketInitializations = new Map<string, {
    twitchBroadcasterUsername: string;
    twitchBroadcasterUserId: string;
    twitchRole: string;
    streamId: string;
    streamTitle?: string;
    streamCategory?: string;
    streamStartedAt?: string;
    streamViewerCount?: number;
    cognitoUsername: string;
    cognitoIdToken: string;
}>();


export const initWebSocketServer = (server: any): WebSocketServer => {
    const wss = new WebSocketServer({server});

    wss.on('connection', (ws: WebSocket) => {
        console.log(`${LOG_PREFIX} Frontend client connected`);
        let userId: string | null = null;

        ws.on('message', async (message: string) => {
            try {
                const parsedMessage = JSON.parse(message);

                if (parsedMessage.type === 'auth' && parsedMessage["cognitoIdToken"]) {
                    // todo: figure out what if token is not valid (do we care?)
                    const decodedToken = await verifyToken(parsedMessage["cognitoIdToken"]);
                    userId = decodedToken.sub!;

                    frontendClients.set(userId, {
                        ws,
                        twitchWs: null,
                        awsWs: null,
                        subscriptions: new Set(),
                        cognito: {
                            cognitoIdToken: null,
                            cognitoUsername: null,
                        },
                        twitchData: {
                            twitchBroadcasterUsername: null,
                            twitchBroadcasterUserId: null,
                            twitchRole: null,
                            streamId: null,
                            streamMetadata: {
                                title: undefined,
                                startedAt: undefined,
                                category: undefined,
                                viewerCount: 0,
                                followersCount: 0,
                                subscriberCount: 0,
                                messageCount: 0,
                                positiveMessageCount: 0,
                                negativeMessageCount: 0,
                                neutralMessageCount: 0
                            }
                        }
                    });

                    if (pendingWebSocketInitializations.has(userId)) {
                        const {
                            twitchBroadcasterUsername,
                            twitchBroadcasterUserId,
                            twitchRole,
                            streamId,
                            streamTitle,
                            streamCategory,
                            streamStartedAt,
                            streamViewerCount,
                            cognitoUsername,
                            cognitoIdToken,
                        } = pendingWebSocketInitializations.get(userId)!;

                        const streamMetadata: TwitchStreamMetadata = {
                            title: streamTitle,
                            startedAt: streamStartedAt,
                            category: streamCategory,
                            viewerCount: streamViewerCount,
                            followersCount: 0,
                            subscriberCount: 0,
                            messageCount: 0,
                            positiveMessageCount: 0,
                            negativeMessageCount: 0,
                            neutralMessageCount: 0
                        }

                        setFrontendClientCognitoData(userId, cognitoIdToken, cognitoUsername);
                        setFrontendClientTwitchData(userId, twitchBroadcasterUsername, twitchBroadcasterUserId, twitchRole, streamId);
                        setFrontendClientTwitchStreamMetadata(userId, streamMetadata)

                        const twitchResult = await startTwitchWebSocket(twitchBroadcasterUsername, userId);
                        if (twitchResult != null) {
                            frontendClients.get(userId)!.twitchWs = twitchResult;
                        } else {
                            console.error(`${LOG_PREFIX} Twitch websocket not connected for ${userId}`);
                        }

                        const awsResult = connectAwsWebSocket(twitchBroadcasterUsername, userId);
                        if (awsResult != null) {
                            frontendClients.get(userId)!.awsWs = awsResult;
                        } else {
                            console.error(`${LOG_PREFIX} AWS websocket not connected for ${userId}`);
                        }

                        pendingWebSocketInitializations.delete(userId);
                    }
                    console.log(`${LOG_PREFIX} WebSocket authenticated for user ID: ${userId}`);
                }
            } catch (err) {
                console.error(`${LOG_PREFIX} Error processing message:`, err);
                ws.close();
            }
        });

        ws.on('close', async () => {
            console.log(`${LOG_PREFIX} Frontend client disconnected`);
            if (userId) {
                await cleanupUserConnections(userId, frontendClients.get(userId)!.subscriptions);
                frontendClients.delete(userId);
            }
        });
    });

    return wss;
};

async function cleanupUserConnections(userId: string, subscriptions: Set<string>) {
    const userData = frontendClients.get(userId);

    if (userData?.twitchWs && userData.twitchWs.readyState === WebSocket.OPEN) {
        userData.twitchWs.close();
        console.log(`${LOG_PREFIX} Closed Twitch WebSocket for user ID: ${userId}`);
    }

    if (userData?.awsWs && userData.awsWs.readyState === WebSocket.OPEN) {
        userData.awsWs.close();
        console.log(`${LOG_PREFIX} Closed AWS WebSocket for user ID: ${userId}`);
    }

    await cleanupSubscriptions(userId, subscriptions);

    if (userData?.ws && userData.ws.readyState === WebSocket.OPEN) {
        userData.ws.close();
        console.log(`${LOG_PREFIX} Closed frontend WebSocket for user ID: ${userId}`);
    }
}


async function cleanupSubscriptions(userId: string, subscriptions: Set<string>) {
    console.log(`${LOG_PREFIX} Cleaning up subscriptions for user ID: ${userId}`);

    for (const subscriptionId of subscriptions) {
        try {
            const result = await deleteTwitchSubscription(subscriptionId, TWITCH_BOT_OAUTH_TOKEN, CLIENT_ID);
            if (result) {
                subscriptions.delete(subscriptionId);
            }
        } catch (err) {
            console.error(`${LOG_PREFIX} Failed to delete subscription ${subscriptionId}:`, err);
        }
    }
    console.log(`${LOG_PREFIX} Cleanup completed for user ID: ${userId}`);
}


export function trackSubscription(userId: string, subscriptionId: string) {
    const userData = frontendClients.get(userId);
    if (userData) {
        userData.subscriptions.add(subscriptionId);
        console.log(`${LOG_PREFIX} Tracked subscription ${subscriptionId} for user ID: ${userId}`);
    } else {
        console.error(`${LOG_PREFIX} Attempted to track subscription for nonexistent user ID: ${userId}`);
    }
}

// todo jaka będzie struktura message?
export const sendMessageToFrontendClient = (userId: string, message: any) => {
    const userData = frontendClients.get(userId);
    if (userData && userData.ws.readyState === WebSocket.OPEN) {
        userData.ws.send(JSON.stringify(message));
    } else {
        console.log(`${LOG_PREFIX} WebSocket for user ID ${userId} is not available`);
    }
};
