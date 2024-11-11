import {ensureValidAccessToken, getCognitoAccessToken} from "./cognitoAuth.js";
import axios from "axios";

const API_GATEWAY_URL = 'https://t7pqmsv4x4.execute-api.eu-central-1.amazonaws.com/test'
const MESSAGES_PATH = `${API_GATEWAY_URL}/twitch-message`

const LOG_PREFIX = `API_GATEWAY_REST:`

export async function sendMessageToApiGateway(broadcasterUserLogin, chatterUserLogin, messageText) {
    try {

        await ensureValidAccessToken();
        const accessToken = getCognitoAccessToken();

        const response = await axios.post(MESSAGES_PATH, {
            broadcaster_user_login: broadcasterUserLogin,
            chatter_user_login: chatterUserLogin,
            message_text: messageText
        }, {
            headers: {
                'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json'
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