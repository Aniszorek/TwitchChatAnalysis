import {WebSocket, WebSocketServer} from 'ws';
import {verifyToken} from "../aws/cognitoAuth.js";
import {deleteTwitchSubscription} from "../api_calls/twitchApiCalls.js";
import {CLIENT_ID, startTwitchWebSocket, TWITCH_BOT_OAUTH_TOKEN} from "./bot.js";
import {connectAwsWebSocket} from "../aws/websocketApi.js";

export const frontendClients = new Map();
export const pendingWebSocketInitializations = new Map();
const LOG_PREFIX = 'BACKEND WS:'

export const initWebSocketServer = (server) => {
    const wss = new WebSocketServer({server});

    wss.on('connection', (ws) => {
        console.log(`${LOG_PREFIX} Frontend client connected`);
        let userId = null;

        ws.on('message', async (message) => {
            try {
                const parsedMessage = JSON.parse(message);

                if (parsedMessage.type === 'auth' && parsedMessage["cognitoIdToken"]) {
                    // todo: co jeśli token nie jest poprawny?
                    const decodedToken = await verifyToken(parsedMessage["cognitoIdToken"]);
                    userId = decodedToken.sub;

                    frontendClients.set(userId, {
                        ws,
                        twitchWs: null,
                        awsWs: null,
                        subscriptions: new Set(),
                        cognito: {
                            cognitoIdToken: null,
                            cognitoRefreshToken: null,
                            cognitoExpiryTime: null,
                        },
                        twitchData: {
                            twitchBroadcasterUsername: null,
                            streamId: null
                        }
                    });

                    if (pendingWebSocketInitializations.has(userId)) {
                        const { twitchBroadcasterUsername,
                            streamId,
                            cognitoIdToken,
                            cognitoRefreshToken,
                            cognitoTokenExpiryTime } = pendingWebSocketInitializations.get(userId);

                        setFrontendClientCognitoData(userId, cognitoIdToken, cognitoRefreshToken, cognitoTokenExpiryTime)
                        setFrontendClientTwitchData(userId,twitchBroadcasterUsername, streamId)

                        const twitchResult = await startTwitchWebSocket(
                            twitchBroadcasterUsername,
                            userId
                        );
                        if (twitchResult != null) {
                            frontendClients.get(userId).twitchWs = twitchResult;
                        } else {
                            console.error(`${LOG_PREFIX} Twitch websocket not connected for ${userId}`);
                        }

                        const awsResult = connectAwsWebSocket(twitchBroadcasterUsername, userId);
                        if (awsResult != null) {
                            frontendClients.get(userId).awsWs = awsResult;
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
                await cleanupUserConnections(userId, frontendClients.get(userId).subscriptions);
                frontendClients.delete(userId);
            }
        });
    });

    return wss;
};

async function cleanupUserConnections(userId) {
    const userData = frontendClients.get(userId);

    if (userData.twitchWs && userData.twitchWs.readyState === WebSocket.OPEN) {
        userData.twitchWs.close();
        console.log(`${LOG_PREFIX} Closed Twitch WebSocket for user ID: ${userId}`);
    }

    if (userData.awsWs && userData.awsWs.readyState === WebSocket.OPEN) {
        userData.awsWs.close();
        console.log(`${LOG_PREFIX} Closed AWS WebSocket for user ID: ${userId}`);
    }

    await cleanupSubscriptions(userId, userData.subscriptions);

    if (userData.ws && userData.ws.readyState === WebSocket.OPEN) {
        userData.ws.close();
        console.log(`${LOG_PREFIX} Closed frontend WebSocket for user ID: ${userId}`);
    }
}


async function cleanupSubscriptions(userId, subscriptions) {
    console.log(`${LOG_PREFIX} Cleaning up subscriptions for user ID: ${userId}`);

    for (const subscriptionId of subscriptions) {
        try {
            const success = await deleteTwitchSubscription(subscriptionId, TWITCH_BOT_OAUTH_TOKEN, CLIENT_ID);
            if (success) {
                subscriptions.delete(subscriptionId);
            }
        } catch (err) {
            console.error(`${LOG_PREFIX} Failed to delete subscription ${subscriptionId}:`, err);
        }
    }
    console.log(`${LOG_PREFIX} Cleanup completed for user ID: ${userId}`);
}

export function trackSubscription(userId, subscriptionId) {
    const userData = frontendClients.get(userId);
    if (userData) {
        userData.subscriptions.add(subscriptionId);
        console.log(`${LOG_PREFIX} Tracked subscription ${subscriptionId} for user ID: ${userId}`);
    } else {
        console.error(`${LOG_PREFIX} Attempted to track subscription for nonexistent user ID: ${userId}`);
    }
}

export const sendMessageToFrontendClient = (userId, message) => {
    const userData = frontendClients.get(userId);
    if (userData && userData.ws.readyState === WebSocket.OPEN) {
        userData.ws.send(JSON.stringify(message));
    } else {
        console.log(`${LOG_PREFIX} WebSocket for user ID ${userId} is not available`);
    }
};

export const setFrontendClientCognitoData = (cognitoUserId, cognitoIdToken, cognitoRefreshToken, cognitoExpiryTime) => {

    if(cognitoIdToken)
        frontendClients.get(cognitoUserId).cognito.cognitoIdToken = cognitoIdToken
    if(cognitoRefreshToken)
        frontendClients.get(cognitoUserId).cognito.cognitoRefreshToken = cognitoRefreshToken
    if(cognitoExpiryTime)
        frontendClients.get(cognitoUserId).cognito.cognitoExpiryTime = cognitoExpiryTime
}

export const setFrontendClientTwitchData = (cognitoUserId, twitchBroadcasterUsername, streamId) => {
    frontendClients.get(cognitoUserId).twitchData.twitchBroadcasterUsername = twitchBroadcasterUsername
    setFrontendClientTwitchDataStreamId(cognitoUserId, streamId)
}

export const setFrontendClientTwitchDataStreamId = (cognitoUserId, streamId) => {
    frontendClients.get(cognitoUserId).twitchData.streamId = streamId
}

