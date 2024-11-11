import WebSocket from "ws";

import {sendMessageToApiGateway} from "../aws/apiGateway.js";
import axios from "axios";

const LOG_PREFIX = 'TWITCH_WS:'

// GLOBAL VARIABLES - ensure global access by exporting these or writing getter/setter
export const TWITCH_BOT_OAUTH_TOKEN = process.env["TWITCH_BOT_OAUTH_TOKEN"]; // Needs scopes user:bot, user:read:chat, user:write:chat - konto bota/moderatora
export const CLIENT_ID = process.env["TWITCH_APP_CLIENT_ID"]; // id aplikacji
export const BOT_USER_ID = process.env["BOT_USER_ID"]; // This is the User ID of the chat bot - konto bota/moderatora
export const CHAT_CHANNEL_USER_ID = process.env["CHAT_CHANNEL_USER_ID"] // This is the User ID of the channel that the bot will join and listen to chat messages of
let websocketSessionID;
let streamId;
let twitchUserId;
//////////////////////////////////////////////////////////////////////////////////////


const EVENTSUB_WEBSOCKET_URL = 'wss://eventsub.wss.twitch.tv/ws';
const EVENTSUB_SUBSCRIPTION_URL = 'https://api.twitch.tv/helix/eventsub/subscriptions'



export function startWebSocketClient(twitchUsername) {
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
                    const broadcasterUserLogin = data.payload.event.broadcaster_user_login;
                    const chatterUserLogin = data.payload.event.chatter_user_login;
                    const messageText = data.payload.event.message.text;

                    console.log(`MSG #${broadcasterUserLogin} <${chatterUserLogin}> ${messageText}`);
                    // TODO only streamer should send message to aws
                    sendMessageToApiGateway(broadcasterUserLogin, chatterUserLogin, messageText);
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
                broadcaster_user_id: CHAT_CHANNEL_USER_ID, user_id: BOT_USER_ID
            }, transport: {
                method: 'websocket', session_id: websocketSessionID
            }
        }, {
            headers: headers
        });
        verifyRegisterResponse(registerMessageResponse, 'channel.chat.message');


        const registerOnlineResponse = await axios.post(EVENTSUB_SUBSCRIPTION_URL, {
            type: 'stream.online', version: '1', condition: {
                broadcaster_user_id: CHAT_CHANNEL_USER_ID
            }, transport: {
                method: 'websocket', session_id: websocketSessionID
            }
        }, {
            headers: headers
        });
        verifyRegisterResponse(registerOnlineResponse, 'stream.online');


        const registerOfflineResponse = await axios.post(EVENTSUB_SUBSCRIPTION_URL, {
            type: 'stream.offline', version: '1', condition: {
                broadcaster_user_id: CHAT_CHANNEL_USER_ID
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

export function getTwitchUserId() {
    return twitchUserId;
}
export function setTwitchUserId(userId){
    twitchUserId = userId
}
export function getStreamId() {
    return streamId;
}
export function setStreamId(_streamId){
    streamId = _streamId
}