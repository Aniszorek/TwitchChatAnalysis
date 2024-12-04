import jwt from "jsonwebtoken";
import {AxiosResponse} from "axios";
import {isCognitoRoleValid} from "../../cognitoRoles";
import {apiGatewayClient, CustomAxiosRequestConfig} from "../apiGatewayConfig";

const LOG_PREFIX = `API_GATEWAY_REST:`;

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

        const response: AxiosResponse<ValidateUserRoleResponse> = await apiGatewayClient.post('/twitchChatAnalytics-authorization',{
            oauth_token: twitch_oauth_token,
            cognito_username: username,
            broadcaster_user_login: broadcaster_user_login,
            client_id: client_id
        },{
            cognitoIdToken: cognitoIdToken,
            broadcasterUserLogin: broadcaster_user_login,
        } as CustomAxiosRequestConfig)

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
        console.error(`${LOG_PREFIX} [ValidateUserRole] Error sending message to API Gateway: ${JSON.stringify(error, null, 2)}`);
        return undefined;
    }
}