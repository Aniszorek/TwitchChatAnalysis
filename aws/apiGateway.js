import {ensureValidAccessToken, getAccessToken} from "./cognitoAuth.js";
import axios from "axios";

const API_GATEWAY_URL = 'https://t7pqmsv4x4.execute-api.eu-central-1.amazonaws.com/test'
const MESSAGES_PATH = `${API_GATEWAY_URL}/twitch-message`

export async function sendMessageToApiGateway(broadcasterUserLogin, chatterUserLogin, messageText) {
    try {

        await ensureValidAccessToken();
        const accessToken = getAccessToken();

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
            console.log(`Message sent to API Gateway: ${messageText}`);
        } else {
            console.error(`Failed to send message to API Gateway. Status: ${response.status}`);
        }
    } catch (error) {
        console.error(`Error sending message to API Gateway: ${error}`);
    }
}