import WebSocket from "ws";

import {sendMessageToApiGateway} from "../aws/apiGateway.js";
import axios from "axios";

const TWITCH_BOT_OAUTH_TOKEN = process.env["TWITCH_BOT_OAUTH_TOKEN"]; // Needs scopes user:bot, user:read:chat, user:write:chat - konto bota/moderatora
const CLIENT_ID = process.env["TWITCH_APP_CLIENT_ID"]; // id aplikacji
const BOT_USER_ID = process.env["BOT_USER_ID"]; // This is the User ID of the chat bot - konto bota/moderatora
const CHAT_CHANNEL_USER_ID = process.env["CHAT_CHANNEL_USER_ID"] // This is the User ID of the channel that the bot will join and listen to chat messages of

const EVENTSUB_WEBSOCKET_URL = 'wss://eventsub.wss.twitch.tv/ws';
const EVENTSUB_SUBSCRIPTION_URL = 'https://api.twitch.tv/helix/eventsub/subscriptions'
const TWITCH_VALIDATE_AUTH_URL = 'https://id.twitch.tv/oauth2/validate';

let websocketSessionID;

export function startWebSocketClient() {
    const websocketClient = new WebSocket(EVENTSUB_WEBSOCKET_URL);

    websocketClient.on('error', console.error);

    websocketClient.on('open', () => {
        console.log('WebSocket connection opened to ' + EVENTSUB_WEBSOCKET_URL);
    });

    websocketClient.on('message', (data) => {
        handleWebSocketMessage(JSON.parse(data.toString()));
    });

    return websocketClient;
}

export async function validateTwitchAuth() {
    let response = await axios.get(TWITCH_VALIDATE_AUTH_URL, {
        headers: {
            'Authorization': 'OAuth ' + TWITCH_BOT_OAUTH_TOKEN
        }
    });

    if (response.status !== 200) {
        let data = await response.data();
        console.error(`Token is not valid. ${TWITCH_VALIDATE_AUTH_URL} returned status code ` + response.status);
        console.error(data);
        process.exit(1);
    }

    console.log("Validated token.");
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
                    sendMessageToApiGateway(broadcasterUserLogin, chatterUserLogin, messageText);
                    break;
            }
            break;
    }
}

async function registerEventSubListeners() {
    try {
        const response = await axios.post(EVENTSUB_SUBSCRIPTION_URL, {
            type: 'channel.chat.message', version: '1', condition: {
                broadcaster_user_id: CHAT_CHANNEL_USER_ID, user_id: BOT_USER_ID
            }, transport: {
                method: 'websocket', session_id: websocketSessionID
            }
        }, {
            headers: {
                'Authorization': `Bearer ${TWITCH_BOT_OAUTH_TOKEN}`,
                'Client-Id': CLIENT_ID,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 202) {
            console.log(`Subscribed to channel.chat.message [${response.data.data[0].id}]`);
        } else {
            console.error(`Failed to subscribe. API call returned status code ${response.status}`);
            console.error(response.data);
            process.exit(1);
        }
    } catch (error) {
        console.error("Error during subscription:", error.response ? error.response.data : error.message);
        process.exit(1);
    }
}