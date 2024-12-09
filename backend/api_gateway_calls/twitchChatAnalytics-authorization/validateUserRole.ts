import jwt from "jsonwebtoken";
import {AxiosResponse} from "axios";
import {isCognitoRoleValid} from "../../cognitoRoles";
import {apiGatewayClient, CustomAxiosRequestConfig} from "../apiGatewayConfig";
import {logger} from "../../utilities/logger";
import {IS_DEBUG_ENABLED} from "../../entryPoint";

const LOG_PREFIX = `API_GATEWAY_REST`;

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
            logger.error(`Invalid Cognito token`, LOG_PREFIX);
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
            logger.error(`Unknown role: ${body.role} - Status: ${IS_DEBUG_ENABLED ? JSON.stringify(body, null ,2) : ""}`, LOG_PREFIX);
            return undefined;
        }

        if (statusCode === 200) {
            logger.info(
                `Data sent to API Gateway: ${broadcaster_user_login} ${username}. Response: ${IS_DEBUG_ENABLED ? JSON.stringify(body, null, 2) : ""}`,
                LOG_PREFIX
        );
            return {role: body.role, cognitoUsername: username};
        } else {
            logger.error(`Failed authorization. Status: ${IS_DEBUG_ENABLED ? JSON.stringify(body, null, 2) : ""}`, LOG_PREFIX);
            return undefined;
        }

    } catch (error: any) {
        logger.error(`Error sending message to API Gateway: ${IS_DEBUG_ENABLED ? JSON.stringify(error, null, 2): ""}`, LOG_PREFIX);
        return undefined;
    }
}