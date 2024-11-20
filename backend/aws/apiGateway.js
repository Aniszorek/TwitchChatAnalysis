import {ensureValidIdToken, getCognitoIdToken} from "./cognitoAuth.js";
import axios from "axios";
import jwt from "jsonwebtoken";

const API_GATEWAY_URL = 'https://t7pqmsv4x4.execute-api.eu-central-1.amazonaws.com/test'
const MESSAGES_PATH = `${API_GATEWAY_URL}/twitch-message`
const UPDATE_USER_PATH = `${API_GATEWAY_URL}/twitchChatAnalytics-authorization`

const LOG_PREFIX = `API_GATEWAY_REST:`

export async function sendMessageToApiGateway(broadcasterUserLogin, chatterUserLogin, messageText) {
    try {

        await ensureValidIdToken();
        const cognitoIdToken = getCognitoIdToken();

        const response = await axios.post(MESSAGES_PATH, {
            chatter_user_login: chatterUserLogin,
            message_text: messageText
        }, {
            headers: {
                'Authorization': `Bearer ${cognitoIdToken}`,
                'Content-Type': 'application/json',
                'BroadcasterUserLogin': broadcasterUserLogin
            }
        });

        if (response.status === 200) {
            console.log(`${LOG_PREFIX} Message sent to API Gateway: ${messageText}`);
        } else {
            console.error(`${LOG_PREFIX} Failed to send message to API Gateway. Status: ${response.status}`);
        }
    } catch (error) {
        console.error(`${LOG_PREFIX} Error sending message to API Gateway: ${error}`);
    }
}

export async function validateUserRole(twitch_oauth_token, broadcaster_user_login, client_id) {
    try {
        await ensureValidIdToken();
        const accessToken = getCognitoIdToken();

        const decoded = jwt.decode(accessToken);
        const username = decoded["cognito:username"];

        const response = await axios.post(UPDATE_USER_PATH, {
            oauth_token: twitch_oauth_token,
            cognito_username: username,
            broadcaster_user_login: broadcaster_user_login,
            client_id: client_id
        }, {
            headers: {
                'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json'
            }
        });

        if (response.data.statusCode === 200) {
            console.log(`${LOG_PREFIX} [ValidateUserRole] Data sent to API Gateway: ${broadcaster_user_login} ${username}. Response: ${response.data.body}`);
        } else {
            console.error(`${LOG_PREFIX} [ValidateUserRole] Failed authorization. Status: ${response.data.body}`);
        }

    } catch (error) {
        console.error(`${LOG_PREFIX} [ValidateUserRole] Error sending message to API Gateway: ${error}`);
    }
}