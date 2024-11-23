import WebSocket from "ws";

import {sendMessageToApiGateway} from "../aws/apiGateway.js";
import axios from "axios";
import {fetchTwitchStreamId, fetchTwitchUserId} from "../api_calls/twitchApiCalls.js";
import {broadcastMessageToFrontend} from "./wsServer.js";

const LOG_PREFIX = 'TWITCH_WS:'

// GLOBAL VARIABLES - ensure global access by exporting these or writing getter/setter
export const TWITCH_BOT_OAUTH_TOKEN = process.env["TWITCH_BOT_OAUTH_TOKEN"]; // Needs scopes user:bot, user:read:chat, user:write:chat - konto bota/moderatora
export const CLIENT_ID = process.env["TWITCH_APP_CLIENT_ID"]; // id aplikacji
export const BOT_USER_ID = process.env["BOT_USER_ID"]; // This is the User ID of the chat bot - konto bota/moderatora
let websocketSessionID;
let streamId;
let broadcasterId;
//////////////////////////////////////////////////////////////////////////////////////


const EVENTSUB_WEBSOCKET_URL = 'wss://eventsub.wss.twitch.tv/ws';
const EVENTSUB_SUBSCRIPTION_URL = 'https://api.twitch.tv/helix/eventsub/subscriptions'



export async function startWebSocketClient(twitchUsername) {
    await fetchTwitchUserId(twitchUsername, TWITCH_BOT_OAUTH_TOKEN, CLIENT_ID)
        .catch(error => console.error('[TWITCH] Error while fetching id for twitch username:', error));

    await fetchTwitchStreamId(broadcasterId, TWITCH_BOT_OAUTH_TOKEN, CLIENT_ID);

    const websocketClient = new WebSocket(EVENTSUB_WEBSOCKET_URL);

    console.log(`${LOG_PREFIX} Starting WebSocket client for:`, twitchUsername);

    websocketClient.on('error', console.error);

    websocketClient.on('open', () => {
        console.log(`${LOG_PREFIX} WebSocket connection opened to ` + EVENTSUB_WEBSOCKET_URL);
    });

    websocketClient.on('message', (data) => {
        handleWebSocketMessage(JSON.parse(data.toString()));
    });

    return websocketClient;
}

function handleWebSocketMessage(data) {
    switch (data.metadata.message_type) {
        case 'session_welcome':
            websocketSessionID = data.payload.session.id;
            registerEventSubListeners();
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
                    // TODO only streamer should send message to aws
                    sendMessageToApiGateway(msg);
                    broadcastMessageToFrontend(msg);
                    break;
                case 'stream.online':
                    const streamId = data.payload.event.id;
                    console.log(`${LOG_PREFIX} Stream online. Stream ID: ${streamId}`);
                    setStreamId(streamId);
                    break;
                case 'stream.offline':
                    console.log(`${LOG_PREFIX} Stream offline.`);
                    setStreamId(undefined);
                    break;
            }
            break;
    }
}

async function registerEventSubListeners() {
    try {

        const headers = {
            'Authorization': `Bearer ${TWITCH_BOT_OAUTH_TOKEN}`,
                'Client-Id': CLIENT_ID,
                'Content-Type': 'application/json'
        }

        const registerMessageResponse = await axios.post(EVENTSUB_SUBSCRIPTION_URL, {
            type: 'channel.chat.message', version: '1', condition: {
                broadcaster_user_id: broadcasterId, user_id: BOT_USER_ID
            }, transport: {
                method: 'websocket', session_id: websocketSessionID
            }
        }, {
            headers: headers
        });
        verifyRegisterResponse(registerMessageResponse, 'channel.chat.message');


        const registerOnlineResponse = await axios.post(EVENTSUB_SUBSCRIPTION_URL, {
            type: 'stream.online', version: '1', condition: {
                broadcaster_user_id: broadcasterId
            }, transport: {
                method: 'websocket', session_id: websocketSessionID
            }
        }, {
            headers: headers
        });
        verifyRegisterResponse(registerOnlineResponse, 'stream.online');


        const registerOfflineResponse = await axios.post(EVENTSUB_SUBSCRIPTION_URL, {
            type: 'stream.offline', version: '1', condition: {
                broadcaster_user_id: broadcasterId
            }, transport: {
                method: 'websocket', session_id: websocketSessionID
            }
        }, {
            headers: headers
        });
        verifyRegisterResponse(registerOfflineResponse, 'stream.offline');

    } catch (error) {
        console.error(`${LOG_PREFIX} Error during subscription:`, error.response ? error.response.data : error.message);
        process.exit(1);
    }


}

function verifyRegisterResponse(response, registerType) {
    if (response.status === 202) {
        console.log(`${LOG_PREFIX} Subscribed to ${registerType} [${response.data.data[0].id}]`);
    } else {
        console.error(`${LOG_PREFIX} Failed to subscribe to ${registerType}. Status code ${response.status}`);
        console.error(response.data);
        process.exit(1);
    }
}

export function getBroadcasterId() {
    return broadcasterId;
}
export function setBroadcasterId(userId){
    broadcasterId = userId
}
export function getStreamId() {
    return streamId;
}
export function setStreamId(_streamId){
    streamId = _streamId
}