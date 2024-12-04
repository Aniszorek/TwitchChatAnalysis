import {getClientAndCognitoIdToken} from "../../bot/frontendClients";
import {apiGatewayClient, CustomAxiosRequestConfig} from "../apiGatewayConfig";
import {LogColor, logger} from "../../utilities/logger";

const LOG_PREFIX = `API_GATEWAY_REST`;

interface GetStreamMessage {
    "stream_id": string,
    "broadcaster_username": string,
    "stream_title": string,
    "started_at": string,
    "ended_at": string | null,
    "start_follows": number,
    "end_follows": string | null,
    "start_subs": number,
    "end_subs": string | null
}

export async function getStreamsByBroadcasterUsernameFromApiGateway(cognitoUserId: string, broadcasterUsername: string) {
    try {
        const {cognitoIdToken} = getClientAndCognitoIdToken(cognitoUserId)

        if (!broadcasterUsername) {
            throw new Error(`missing broadcasterUsername for cognitoUserId: ${cognitoUserId}`);
        }

        const response = await apiGatewayClient.get('/stream',{
            broadcasterUserLogin: broadcasterUsername,
            cognitoIdToken: cognitoIdToken,
        } as CustomAxiosRequestConfig)

        if (response.status === 200) {
            logger.info(`GET /stream OK`, LOG_PREFIX, {color: LogColor.YELLOW_BRIGHT});
            return Array.isArray(response.data)
                ? (response.data as GetStreamMessage[])
                : [];

        } else {
            logger.error(`GET /stream FAILED. Status: ${response.status}`, LOG_PREFIX);
            return [];
        }
    }catch (error: any) {
        logger.error(`GET /stream FAILED: ${error.message}`, LOG_PREFIX);
        return [];
    }
}