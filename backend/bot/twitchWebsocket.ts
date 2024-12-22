import WebSocket from "ws";
import {checkReadinessAndNotifyFrontend} from "./localWebsocket/wsServer";
import {CLIENT_ID} from "../envConfig";
import {EventSubSubscriptionType} from "./eventsubHandlers/eventSubSubscriptionType";
import {
    channelChatDeleteMessageHandler,
    channelChatMessageHandler,
    channelFollowHandler,
    channelSubscribeHandler,
    channelUpdateHandler,
    streamOfflineHandler,
    streamOnlineHandler
} from "./eventsubHandlers/eventsubHandlers";
import {LogColor, logger, LogStyle} from "../utilities/logger";
import {frontendClients} from "../websocket/frontendClients";
import {verifyUserPermission} from "../utilities/cognitoRoles";
import {COGNITO_ROLES} from "../utilities/CognitoRoleEnum";
import {twitchUsersController} from "../routes/twitch/controller/twitchUsersController";
import {twitchEventsubController} from "../routes/twitch/controller/twitchEventsubController";
import {TwitchWebSocketMessage} from "./twitchWebsocketMessage";

const LOG_PREFIX = 'TWITCH_WS'
const EVENTSUB_WEBSOCKET_URL = 'wss://eventsub.wss.twitch.tv/ws';

export async function startTwitchWebSocket(twitchUsername: string, cognitoUserId: string): Promise<WebSocket | null> {
    try {
        const twitchWebSocket = new WebSocket(EVENTSUB_WEBSOCKET_URL);

        logger.info(`Starting WebSocket client for: ${twitchUsername}`, LOG_PREFIX, {color: LogColor.MAGENTA_BRIGHT, style: LogStyle.BOLD});

        twitchWebSocket.on("error", (error) => logger.error(`WebSocket Error: ${error.message}`, LOG_PREFIX));

        twitchWebSocket.on("open", () => {
            logger.info(`Twitch WebSocket connection opened for user ID: ${cognitoUserId}`, LOG_PREFIX, {color: LogColor.MAGENTA_BRIGHT});
        });

        twitchWebSocket.on("message", (data: WebSocket.Data) => {
            const parsedData: TwitchWebSocketMessage = JSON.parse(data.toString());
            handleWebSocketMessage(parsedData, cognitoUserId);
        });

        return twitchWebSocket;
    } catch (error: any) {
        logger.error(`Error while starting WebSocket client for Twitch: ${error.message}`, LOG_PREFIX);
        return null;
    }

}

async function handleWebSocketMessage(data: TwitchWebSocketMessage, cognitoUserId: string): Promise<void> {
    const twitchOauthToken = frontendClients.get(cognitoUserId)!.twitchData.twitchOauthToken;
    switch (data.metadata.message_type) {
        case 'session_welcome': {
            const websocketSessionID = data.payload.session!.id;
            await registerEventSubListeners(cognitoUserId, websocketSessionID, twitchOauthToken!);
            const client = frontendClients.get(cognitoUserId);
            if (client) {
                client.readiness.twitchReady = true;
                checkReadinessAndNotifyFrontend(cognitoUserId);
            }
            break;
        }

        case 'notification': {
            switch (data.metadata.subscription_type) {
                case EventSubSubscriptionType.CHANNEL_CHAT_MESSAGE: {
                    channelChatMessageHandler(cognitoUserId,data)
                    break;
                }
                case EventSubSubscriptionType.STREAM_ONLINE: {
                    await streamOnlineHandler(cognitoUserId, data)
                    break;
                }
                case EventSubSubscriptionType.STREAM_OFFLINE: {
                    await streamOfflineHandler(cognitoUserId, data)
                    break;
                }
                case EventSubSubscriptionType.CHANNEL_FOLLOW: {
                    channelFollowHandler(cognitoUserId, data)
                    break;
                }
                case EventSubSubscriptionType.CHANNEL_SUBSCRIBE:
                case EventSubSubscriptionType.CHANNEL_SUBSCRIPTION_MESSAGE:
                {
                    channelSubscribeHandler(cognitoUserId, data)
                    break;
                }
                case EventSubSubscriptionType.CHANNEL_UPDATE:
                {
                    channelUpdateHandler(cognitoUserId, data)
                    break;
                }
                case EventSubSubscriptionType.MESSAGE_DELETE:
                {
                    channelChatDeleteMessageHandler(cognitoUserId, data)
                    break;
                }
            }
            break;
        }
    }
}

async function registerEventSubListeners(cognitoUserId: string, websocketSessionID: string, twitchOauthToken: string): Promise<void> {
    try {

        const headers = {
            'Authorization': `Bearer ${twitchOauthToken}`,
            'Client-Id': CLIENT_ID,
            'Content-Type': 'application/json'
        }
        const viewerId = await twitchUsersController.fetchTwitchUserIdFromOauthToken(twitchOauthToken);
        const broadcasterId = frontendClients.get(cognitoUserId)?.twitchData.twitchBroadcasterUserId;

        if (!viewerId) {
            logger.error('No viewer found with given oauth token', LOG_PREFIX)
        }

        if (!broadcasterId) {
            logger.error('No broadcaster found to subscribe to', LOG_PREFIX)
        }

        await twitchEventsubController.postTwitchSubscription(cognitoUserId, websocketSessionID, EventSubSubscriptionType.CHANNEL_CHAT_MESSAGE, {
            broadcaster_user_id: broadcasterId, user_id: viewerId,
        }, headers)

        await twitchEventsubController.postTwitchSubscription(cognitoUserId, websocketSessionID, EventSubSubscriptionType.STREAM_ONLINE, {
            broadcaster_user_id: broadcasterId
        }, headers)

        await twitchEventsubController.postTwitchSubscription(cognitoUserId, websocketSessionID, EventSubSubscriptionType.STREAM_OFFLINE, {
            broadcaster_user_id: broadcasterId
        }, headers)

        await twitchEventsubController.postTwitchSubscription(cognitoUserId, websocketSessionID, EventSubSubscriptionType.MESSAGE_DELETE,{
            broadcaster_user_id: broadcasterId,
            user_id: viewerId
        }, headers)

        // moderator role required
        if(verifyUserPermission(cognitoUserId, COGNITO_ROLES.MODERATOR , 'Subscribe to channel follow')) {
            await twitchEventsubController.postTwitchSubscription(cognitoUserId, websocketSessionID, EventSubSubscriptionType.CHANNEL_FOLLOW, {
                broadcaster_user_id: broadcasterId, moderator_user_id: viewerId,
            }, headers, '2')
        }

        // streamer role required
        if(verifyUserPermission(cognitoUserId, COGNITO_ROLES.STREAMER, 'Subscribe to channel subscription'))
        {
            // does not include resubscriptions
            await twitchEventsubController.postTwitchSubscription(cognitoUserId, websocketSessionID, EventSubSubscriptionType.CHANNEL_SUBSCRIBE, {
                broadcaster_user_id: broadcasterId
            }, headers)

            // for resubscription events (according to Twitch documentation, didn't test it)
            await twitchEventsubController.postTwitchSubscription(cognitoUserId, websocketSessionID, EventSubSubscriptionType.CHANNEL_SUBSCRIPTION_MESSAGE, {
                broadcaster_user_id: broadcasterId
            }, headers)

        }

        await twitchEventsubController.postTwitchSubscription(cognitoUserId, websocketSessionID, EventSubSubscriptionType.CHANNEL_UPDATE, {
            broadcaster_user_id: broadcasterId
        }, headers)

    } catch (error: any) {
        logger.error(`Error during subscription: ${error.response ? JSON.stringify(error.response.data, null, 2) : error.message}`, LOG_PREFIX);
    }
}
