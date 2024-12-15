import WebSocket from "ws";
import axios, {AxiosResponse} from "axios";
import {checkReadinessAndNotifyFrontend, trackSubscription} from "./wsServer";
import {COGNITO_ROLES, verifyUserPermission} from "../cognitoRoles";
import {
    fetchTwitchStreamMetadata,
    fetchTwitchUserId,
    fetchTwitchUserIdFromOauthToken,
    TwitchStreamData
} from "../twitch_calls/twitchAuth";
import {CLIENT_ID} from "../envConfig";
import {EventSubSubscriptionType} from "./eventSubSubscriptionType";
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
import {frontendClients} from "./frontendClients";
import {IS_DEBUG_ENABLED} from "../entryPoint";

const LOG_PREFIX = 'TWITCH_WS'


const EVENTSUB_WEBSOCKET_URL = 'wss://eventsub.wss.twitch.tv/ws';
const EVENTSUB_SUBSCRIPTION_URL = 'https://api.twitch.tv/helix/eventsub/subscriptions'


export interface TwitchWebSocketMessage {
    metadata: {
        message_type: string;
        subscription_type?: string;
        message_timestamp?: string;
    };
    payload: {
        session?: { id: string };
        event?: {
            broadcaster_user_id?: string;
            broadcaster_user_login?: string;
            broadcaster_user_name?: string;
            chatter_user_id?: string;
            chatter_user_login?: string;
            chatter_user_name?: string;
            message?: { text: string };
            message_id?: string;
            id?: string; // For stream.online events
            user_login?: string; // for channel.follow, subscribe, subscription.message events
            title?: string; // for channel.update event
            category_name?: string; // for channel.update event
        };
    };
}

interface VerifyResponseData {
    data: { id: string }[];
}


export async function verifyTwitchUsernameAndStreamStatus(twitchUsername: string): Promise<{
    success: boolean;
    message: string;
    streamStatus?: TwitchStreamData;
    userId?: string
}> {
    const fetchResponse = await fetchTwitchUserId(twitchUsername);

    if (!fetchResponse.found) {
        return {success: false, message: `Streamer with username: ${twitchUsername} not found`};
    }

    const broadcasterId = fetchResponse.userId!;

    const streamStatus: TwitchStreamData = await fetchTwitchStreamMetadata(broadcasterId);
    return {success: true, message: "Twitch username validated and authorized", streamStatus, userId: broadcasterId};
}


export async function startTwitchWebSocket(twitchUsername: string, cognitoUserId: string, twitchOuathToken: string): Promise<WebSocket | null> {
    try {
        const twitchWebSocket = new WebSocket(EVENTSUB_WEBSOCKET_URL);

        logger.info(`Starting WebSocket client for: ${twitchUsername}`, LOG_PREFIX, {color: LogColor.MAGENTA_BRIGHT, style: LogStyle.BOLD});

        twitchWebSocket.on("error", (error) => logger.error(`WebSocket Error: ${error.message}`, LOG_PREFIX));

        twitchWebSocket.on("open", () => {
            logger.info(`Twitch WebSocket connection opened for user ID: ${cognitoUserId}`, LOG_PREFIX, {color: LogColor.MAGENTA_BRIGHT});
        });

        twitchWebSocket.on("message", (data: WebSocket.Data) => {
            const parsedData: TwitchWebSocketMessage = JSON.parse(data.toString());
            handleWebSocketMessage(parsedData, cognitoUserId, twitchOuathToken);
        });

        return twitchWebSocket;
    } catch (error: any) {
        logger.error(`Error while starting WebSocket client for Twitch: ${error.message}`, LOG_PREFIX);
        return null;
    }

}

async function handleWebSocketMessage(data: TwitchWebSocketMessage, cognitoUserId: string, twitchOuathToken: string): Promise<void> {
    switch (data.metadata.message_type) {
        case 'session_welcome': {
            const websocketSessionID = data.payload.session!.id;
            await registerEventSubListeners(cognitoUserId, websocketSessionID, twitchOuathToken);
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

async function registerEventSubListeners(cognitoUserId: string, websocketSessionID: string, twitchOuathToken: string): Promise<void> {
    try {

        const headers = {
            'Authorization': `Bearer ${twitchOuathToken}`,
            'Client-Id': CLIENT_ID,
            'Content-Type': 'application/json'
        }
        const viewerId = await fetchTwitchUserIdFromOauthToken();
        const broadcasterId = frontendClients.get(cognitoUserId)?.twitchData.twitchBroadcasterUserId;

        if (!broadcasterId) {
            logger.error('No broadcaster found to subscribe to', LOG_PREFIX)
        }

        await registerResponse(cognitoUserId, websocketSessionID, EventSubSubscriptionType.CHANNEL_CHAT_MESSAGE, {
            broadcaster_user_id: broadcasterId, user_id: viewerId,
        }, headers)

        await registerResponse(cognitoUserId, websocketSessionID, EventSubSubscriptionType.STREAM_ONLINE, {
            broadcaster_user_id: broadcasterId
        }, headers)

        await registerResponse(cognitoUserId, websocketSessionID, EventSubSubscriptionType.STREAM_OFFLINE, {
            broadcaster_user_id: broadcasterId
        }, headers)

        await registerResponse(cognitoUserId, websocketSessionID, EventSubSubscriptionType.MESSAGE_DELETE,{
            broadcaster_user_id: broadcasterId,
            user_id: viewerId
        }, headers)

        // moderator role required
        if(verifyUserPermission(cognitoUserId, COGNITO_ROLES.MODERATOR, 'Subscribe to channel follow')) {
            await registerResponse(cognitoUserId, websocketSessionID, EventSubSubscriptionType.CHANNEL_FOLLOW, {
                broadcaster_user_id: broadcasterId, moderator_user_id: viewerId,
            }, headers, '2')
        }

        // streamer role required
        if(verifyUserPermission(cognitoUserId, COGNITO_ROLES.STREAMER, 'Subscribe to channel subscription'))
        {
            // does not include resubscriptions
            await registerResponse(cognitoUserId, websocketSessionID, EventSubSubscriptionType.CHANNEL_SUBSCRIBE, {
                broadcaster_user_id: broadcasterId
            }, headers)

            // for resubscription events (according to Twitch documentation, didn't test it)
            await registerResponse(cognitoUserId, websocketSessionID, EventSubSubscriptionType.CHANNEL_SUBSCRIPTION_MESSAGE, {
                broadcaster_user_id: broadcasterId
            }, headers)

        }

        await registerResponse(cognitoUserId, websocketSessionID, EventSubSubscriptionType.CHANNEL_UPDATE, {
            broadcaster_user_id: broadcasterId
        }, headers)

    } catch (error: any) {
        logger.error(`Error during subscription: ${error.response ? JSON.stringify(error.response.data, null, 2) : error.message}`, LOG_PREFIX);
    }
}

function verifyRegisterResponse(response: AxiosResponse<VerifyResponseData>, registerType: string, userId: string): void {
    if (response.status === 202) {
        const subscriptionId = response.data.data[0].id;
        trackSubscription(userId, subscriptionId);
        logger.info(`Subscribed to ${registerType} [${response.data.data[0].id}]`, LOG_PREFIX, {color: LogColor.MAGENTA_BRIGHT});
    } else {
        logger.error(`Failed to subscribe to ${registerType}. Status code ${response.status}`, LOG_PREFIX);
        logger.error(IS_DEBUG_ENABLED ?JSON.stringify(response.data, null, 2) : "", LOG_PREFIX);
    }
}

async function registerResponse(cognitoUserId: string, websocketSessionID: string, type:string, condition:any, headers:any, version:string = '1' ): Promise<void> {
    const response = await axios.post(
        EVENTSUB_SUBSCRIPTION_URL,
        {
            type,
            version: version,
            condition,
            transport: {
                method: 'websocket',
                session_id: websocketSessionID,
            },
        },
        { headers }
    );
    verifyRegisterResponse(response, type, cognitoUserId);
}