import WebSocket from "ws";

import {sendMessageToApiGateway} from "../aws/apiGateway.js";
import axios from "axios";
import {fetchTwitchStreamId, fetchTwitchUserId, fetchTwitchUserIdFromOauthToken} from "../api_calls/twitchApiCalls.js";
import {
    frontendClients,
    sendMessageToFrontendClient,
    setFrontendClientTwitchDataStreamId,
    trackSubscription
} from "./wsServer.js";
import {COGNITO_ROLES, verifyUserPermission} from "../cognitoRoles.js";

const LOG_PREFIX = 'TWITCH_WS:'

// GLOBAL VARIABLES - ensure global access by exporting these or writing getter/setter
// todo this token should be delivered from FE
export const TWITCH_BOT_OAUTH_TOKEN = process.env["TWITCH_BOT_OAUTH_TOKEN"]; // Needs scopes user:bot, user:read:chat, user:write:chat - konto bota/moderatora
// todo move to entrypoint.js ?
export const CLIENT_ID = process.env["TWITCH_APP_CLIENT_ID"]; // id aplikacji
//////////////////////////////////////////////////////////////////////////////////////


const EVENTSUB_WEBSOCKET_URL = 'wss://eventsub.wss.twitch.tv/ws';
const EVENTSUB_SUBSCRIPTION_URL = 'https://api.twitch.tv/helix/eventsub/subscriptions'



export async function verifyTwitchUsernameAndStreamStatus(twitchUsername){
    const fetchResponse = await fetchTwitchUserId(twitchUsername, TWITCH_BOT_OAUTH_TOKEN, CLIENT_ID);

    if (!fetchResponse.found) {
        return { success: false, message: `Streamer with username: ${twitchUsername} not found` };
    }

    const broadcasterId = fetchResponse.userId

    const streamStatus = await fetchTwitchStreamId(broadcasterId, TWITCH_BOT_OAUTH_TOKEN, CLIENT_ID);
    return { success: true, message: 'Twitch username validated and authorized', streamStatus: streamStatus, userId: broadcasterId };
}

export async function startTwitchWebSocket(twitchUsername, cognitoUserId) {
    try{
        const twitchWebsocket = new WebSocket(EVENTSUB_WEBSOCKET_URL);

        console.log(`${LOG_PREFIX} Starting WebSocket client for:`, twitchUsername);

        twitchWebsocket.on('error', console.error);

        twitchWebsocket.on('open', () => {
            console.log(`${LOG_PREFIX} Twitch WebSocket connection opened for user ID: ${cognitoUserId}`);
        });

        twitchWebsocket.on('message', (data) => {
            handleWebSocketMessage(JSON.parse(data.toString()), cognitoUserId);
        });


        return twitchWebsocket;

    } catch (error) {
        console.error(`${LOG_PREFIX} Error while starting websocket clients for twitch/aws: `, error.message);
        return null;
    }

}

function handleWebSocketMessage(data, cognitoUserId) {
    switch (data.metadata.message_type) {
        case 'session_welcome':
            const websocketSessionID = data.payload.session.id;
            registerEventSubListeners(cognitoUserId, websocketSessionID);
            break;
        case 'notification':
            switch (data.metadata.subscription_type) {
                case 'channel.chat.message':
                    const msg = {
                       "broadcasterUserId":      data.payload.event.broadcaster_user_id,
                       "broadcasterUserLogin":   data.payload.event.broadcaster_user_login,
                       "broadcasterUserName":    data.payload.event.broadcaster_user_name,
                       "chatterUserId":          data.payload.event.chatter_user_id,
                       "chatterUserLogin":       data.payload.event.chatter_user_login,
                       "chatterUserName":        data.payload.event.chatter_user_name,
                       "messageText":            data.payload.event.message.text,
                       "messageId":              data.payload.event.message_id,
                       "messageTimestamp":       data.metadata.message_timestamp
                    }
                    console.log(`MSG #${msg.broadcasterUserLogin} <${msg.chatterUserLogin}> ${msg.messageText}`);
                    if(verifyUserPermission(cognitoUserId, COGNITO_ROLES.STREAMER, "send twitch message to aws"))
                    {
                        sendMessageToApiGateway(msg, cognitoUserId);
                    }

                    sendMessageToFrontendClient(cognitoUserId, msg);
                    break;
                case 'stream.online':
                    const streamId = data.payload.event.id;
                    console.log(`${LOG_PREFIX} Stream online. Stream ID: ${streamId}`);
                    setFrontendClientTwitchDataStreamId(cognitoUserId, streamId)
                    break;
                case 'stream.offline':
                    console.log(`${LOG_PREFIX} Stream offline.`);
                    setFrontendClientTwitchDataStreamId(cognitoUserId, undefined)
                    break;
            }
            break;
    }
}

async function registerEventSubListeners(cognitoUserId, websocketSessionID) {
    try {

        const headers = {
            'Authorization': `Bearer ${TWITCH_BOT_OAUTH_TOKEN}`,
                'Client-Id': CLIENT_ID,
                'Content-Type': 'application/json'
        }
        const viewerId = await fetchTwitchUserIdFromOauthToken(TWITCH_BOT_OAUTH_TOKEN, CLIENT_ID)
        const broadcasterId = frontendClients.get(cognitoUserId).twitchData.twitchBroadcasterUserId

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

    } catch (error) {
        console.error(`${LOG_PREFIX} Error during subscription:`, error.response ? error.response.data : error.message);
        process.exit(1);
    }


}

function verifyRegisterResponse(response, registerType, userId) {
    if (response.status === 202) {
        const subscriptionId = response.data.data[0].id;
        trackSubscription(userId, subscriptionId);
        console.log(`${LOG_PREFIX} Subscribed to ${registerType} [${response.data.data[0].id}]`);
    } else {
        console.error(`${LOG_PREFIX} Failed to subscribe to ${registerType}. Status code ${response.status}`);
        console.error(response.data);
        process.exit(1);
    }
}