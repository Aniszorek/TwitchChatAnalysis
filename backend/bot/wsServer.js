import {WebSocket, WebSocketServer} from 'ws';
import {verifyToken} from "../aws/cognitoAuth.js";
import {deleteTwitchSubscription} from "../api_calls/twitchApiCalls.js";
import {CLIENT_ID, TWITCH_BOT_OAUTH_TOKEN} from "./bot.js";

const frontendClients = new Map();
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
                    const decodedToken = await verifyToken(parsedMessage["cognitoIdToken"]);
                    userId = decodedToken.sub;
                    frontendClients.set(userId, {ws, subscriptions: new Set()});
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
                await cleanupSubscriptions(userId, frontendClients.get(userId).subscriptions);
                frontendClients.delete(userId);
            }
        });
    });

    return wss;
};


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
