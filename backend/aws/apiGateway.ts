import axios, {AxiosResponse} from "axios";
import jwt from "jsonwebtoken";
import {frontendClients} from "../bot/wsServer";
import {isCognitoRoleValid} from "../cognitoRoles";

const API_GATEWAY_URL = "https://t7pqmsv4x4.execute-api.eu-central-1.amazonaws.com/test";
const MESSAGES_PATH = `${API_GATEWAY_URL}/twitch-message`;
const UPDATE_USER_PATH = `${API_GATEWAY_URL}/twitchChatAnalytics-authorization`;

const LOG_PREFIX = `API_GATEWAY_REST:`;

interface TwitchMessage {
    broadcasterUserId: string,
    broadcasterUserLogin: string,
    broadcasterUserName: string,
    chatterUserId: string,
    chatterUserLogin: string,
    chatterUserName: string,
    messageText: string,
    messageId: string,
    messageTimestamp: string,
}

interface CognitoIdTokenData {
    "cognito:username": string;
}

interface ValidateUserRoleResponse {
    statusCode: number;
    body: {
        role: string;
    };
}

/**
 * Forwards messages from Twitch EventSub to AWS ApiGateway
 */
export async function sendMessageToApiGateway(msg: TwitchMessage, cognitoUserId: string) {
    try {
        const cognitoIdToken = frontendClients.get(cognitoUserId)?.cognito?.cognitoIdToken;

        if (!cognitoIdToken) {
            console.error(`${LOG_PREFIX} Cognito token missing in wsServer for user: ${cognitoUserId}`);
            return;
        }

        const streamId = frontendClients.get(cognitoUserId)?.twitchData?.streamId;

        const response = await axios.post(MESSAGES_PATH, {
            chatter_user_login: msg.chatterUserLogin,
            message_text: msg.messageText,
            timestamp: msg.messageTimestamp,
            stream_id: streamId
        }, {
            headers: {
                Authorization: `Bearer ${cognitoIdToken}`,
                "Content-Type": "application/json",
                BroadcasterUserLogin: msg.broadcasterUserLogin,
            },
        });

        if (response.status === 200) {
            console.log(`${LOG_PREFIX} Message sent to API Gateway: ${msg.messageText}`);
        } else {
            console.error(`${LOG_PREFIX} Failed to send message to API Gateway. Status: ${response.status}`);
        }
    } catch (error: any) {
        console.error(`${LOG_PREFIX} Error sending message to API Gateway: ${error.message}`);
    }
}


/**
 * Validates if user who passed twitch Oauth is a viewer, moderator or streamer for specified broadcaster
 */
export async function validateUserRole(twitch_oauth_token: string, broadcaster_user_login: string, client_id: string, cognitoIdToken: string) {
    try {
        const decoded: CognitoIdTokenData | null = jwt.decode(cognitoIdToken) as CognitoIdTokenData | null;
        if (!decoded?.["cognito:username"]) {
            console.error(`${LOG_PREFIX} Invalid Cognito token`);
            return undefined;
        }
        const username = decoded["cognito:username"];

        const response: AxiosResponse<ValidateUserRoleResponse> = await axios.post(UPDATE_USER_PATH, {
            oauth_token: twitch_oauth_token,
            cognito_username: username,
            broadcaster_user_login: broadcaster_user_login,
            client_id: client_id
        }, {
            headers: {
                'Authorization': `Bearer ${cognitoIdToken}`, 'Content-Type': 'application/json'
            }
        });

        const {statusCode, body} = response.data;


        if (!isCognitoRoleValid(body.role)) {
            console.error(`${LOG_PREFIX} Unknown role: ${body.role} - Status: ${JSON.stringify(body)}`);
            return undefined;
        }

        if (statusCode === 200) {
            console.log(
                `${LOG_PREFIX} Data sent to API Gateway: ${broadcaster_user_login} ${username}. Response: ${JSON.stringify(body)}`
            );
            return {role: body.role, cognitoUsername: username};
        } else {
            console.error(`${LOG_PREFIX} Failed authorization. Status: ${JSON.stringify(body)}`);
            return undefined;
        }

    } catch (error: any) {
        console.error(`${LOG_PREFIX} [ValidateUserRole] Error sending message to API Gateway: ${error.message}`);
        return undefined;
    }
}