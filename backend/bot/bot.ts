import WebSocket from "ws";

import {sendMessageToApiGateway} from "../aws/apiGateway";
import axios, {AxiosResponse} from "axios";
import {
    fetchTwitchStreamId,
    fetchTwitchUserId,
    fetchTwitchUserIdFromOauthToken,
    TwitchStreamData
} from "../api_calls/twitchApiCalls";
import {
    frontendClients,
    sendMessageToFrontendClient,
    setFrontendClientTwitchDataStreamId,
    trackSubscription
} from "./wsServer";
import {COGNITO_ROLES, verifyUserPermission} from "../cognitoRoles";

const LOG_PREFIX = 'TWITCH_WS:'

// GLOBAL VARIABLES - ensure global access by exporting these or writing getter/setter
// todo this token should be delivered from FE
export const TWITCH_BOT_OAUTH_TOKEN = process.env["TWITCH_BOT_OAUTH_TOKEN"] as string; // Needs scopes user:bot, user:read:chat, user:write:chat - konto bota/moderatora
// todo move to entrypoint.js ?
export const CLIENT_ID = process.env["TWITCH_APP_CLIENT_ID"] as string; // id aplikacji
//////////////////////////////////////////////////////////////////////////////////////

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
    const fetchResponse = await fetchTwitchUserId(twitchUsername, TWITCH_BOT_OAUTH_TOKEN, CLIENT_ID);

    if (!fetchResponse.found) {
        return {success: false, message: `Streamer with username: ${twitchUsername} not found`};
    }

    const broadcasterId = fetchResponse.userId!;

    const streamStatus: TwitchStreamData = await fetchTwitchStreamId(broadcasterId, TWITCH_BOT_OAUTH_TOKEN, CLIENT_ID);
    return {success: true, message: "Twitch username validated and authorized", streamStatus, userId: broadcasterId};
}


export async function startTwitchWebSocket(twitchUsername: string, cognitoUserId: string): Promise<WebSocket | null> {
    try {
        const twitchWebSocket = new WebSocket(EVENTSUB_WEBSOCKET_URL);

        console.log(`${LOG_PREFIX} Starting WebSocket client for: ${twitchUsername}`);

        twitchWebSocket.on("error", (error) => console.error(`${LOG_PREFIX} WebSocket Error:`, error));

        twitchWebSocket.on("open", () => {
            console.log(`${LOG_PREFIX} Twitch WebSocket connection opened for user ID: ${cognitoUserId}`);
        });

        twitchWebSocket.on("message", (data: WebSocket.Data) => {
            const parsedData: TwitchWebSocketMessage = JSON.parse(data.toString());
            handleWebSocketMessage(parsedData, cognitoUserId);
        });

        return twitchWebSocket;
    } catch (error: any) {
        console.error(`${LOG_PREFIX} Error while starting WebSocket client for Twitch: ${error.message}`);
        return null;
    }

}

function handleWebSocketMessage(data: TwitchWebSocketMessage, cognitoUserId: string): void {
    switch (data.metadata.message_type) {
        case 'session_welcome':
            const websocketSessionID = data.payload.session!.id;
            registerEventSubListeners(cognitoUserId, websocketSessionID);
            break;

        case 'notification':
            switch (data.metadata.subscription_type) {
                case 'channel.chat.message':
                    const msg = {
                        "broadcasterUserId": data.payload.event!.broadcaster_user_id!,
                        "broadcasterUserLogin": data.payload.event!.broadcaster_user_login!,
                        "broadcasterUserName": data.payload.event!.broadcaster_user_name!,
                        "chatterUserId": data.payload.event!.chatter_user_id!,
                        "chatterUserLogin": data.payload.event!.chatter_user_login!,
                        "chatterUserName": data.payload.event!.chatter_user_name!,
                        "messageText": data.payload.event!.message!.text!,
                        "messageId": data.payload.event!.message_id!,
                        "messageTimestamp": data.metadata.message_timestamp!
                    }
                    console.log(`MSG #${msg.broadcasterUserLogin} <${msg.chatterUserLogin}> ${msg.messageText}`);
                    if (verifyUserPermission(cognitoUserId, COGNITO_ROLES.STREAMER, "send twitch message to aws")) {
                        sendMessageToApiGateway(msg, cognitoUserId);
                    }

                    sendMessageToFrontendClient(cognitoUserId, msg);
                    break;
                case 'stream.online':
                    const streamId = data.payload.event!.id!;
                    console.log(`${LOG_PREFIX} Stream online. Stream ID: ${streamId}`);
                    setFrontendClientTwitchDataStreamId(cognitoUserId, streamId)
                    break;
                case 'stream.offline':
                    console.log(`${LOG_PREFIX} Stream offline.`);
                    setFrontendClientTwitchDataStreamId(cognitoUserId, null)
                    break;
            }
            break;
    }
}

async function registerEventSubListeners(cognitoUserId: string, websocketSessionID: string): Promise<void> {
    try {

        const headers = {
            'Authorization': `Bearer ${TWITCH_BOT_OAUTH_TOKEN}`,
            'Client-Id': CLIENT_ID,
            'Content-Type': 'application/json'
        }
        const viewerId = await fetchTwitchUserIdFromOauthToken(TWITCH_BOT_OAUTH_TOKEN, CLIENT_ID);
        const broadcasterId = frontendClients.get(cognitoUserId)?.twitchData.twitchBroadcasterUserId;


        // todo można zrobić funkcję do rejestrowania tych responsów a nie 3 razy copy-paste

        const registerMessageResponse = await axios.post(EVENTSUB_SUBSCRIPTION_URL, {
            type: 'channel.chat.message', version: '1', condition: {
                broadcaster_user_id: broadcasterId, user_id: viewerId,
            }, transport: {
                method: 'websocket', session_id: websocketSessionID
            }
        }, {
            headers: headers
        });
        verifyRegisterResponse(registerMessageResponse, 'channel.chat.message', cognitoUserId);


        const registerOnlineResponse = await axios.post(EVENTSUB_SUBSCRIPTION_URL, {
            type: 'stream.online', version: '1', condition: {
                broadcaster_user_id: broadcasterId
            }, transport: {
                method: 'websocket', session_id: websocketSessionID
            }
        }, {
            headers: headers
        });
        verifyRegisterResponse(registerOnlineResponse, 'stream.online', cognitoUserId);


        const registerOfflineResponse = await axios.post(EVENTSUB_SUBSCRIPTION_URL, {
            type: 'stream.offline', version: '1', condition: {
                broadcaster_user_id: broadcasterId
            }, transport: {
                method: 'websocket', session_id: websocketSessionID
            }
        }, {
            headers: headers
        });
        verifyRegisterResponse(registerOfflineResponse, 'stream.offline', cognitoUserId);

    } catch (error: any) {
        console.error(`${LOG_PREFIX} Error during subscription:`, error.response ? error.response.data : error.message);
    }
}

function verifyRegisterResponse(response: AxiosResponse<VerifyResponseData>, registerType: string, userId: string): void {
    if (response.status === 202) {
        const subscriptionId = response.data.data[0].id;
        trackSubscription(userId, subscriptionId);
        console.log(`${LOG_PREFIX} Subscribed to ${registerType} [${response.data.data[0].id}]`);
    } else {
        console.error(`${LOG_PREFIX} Failed to subscribe to ${registerType}. Status code ${response.status}`);
        console.error(response.data);
    }
}