import {getClientAndCognitoIdToken} from "../../bot/frontendClients";
import {apiGatewayClient, CustomAxiosRequestConfig} from "../apiGatewayConfig";
import {LogColor, logger} from "../../utilities/logger";
import axios from "axios";

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
        const { cognitoIdToken } = getClientAndCognitoIdToken(cognitoUserId);

        if (!broadcasterUsername) {
            throw new Error(`Missing broadcasterUsername for cognitoUserId: ${cognitoUserId}`);
        }

        const response = await apiGatewayClient.get('/stream', {
            broadcasterUserLogin: broadcasterUsername,
            cognitoIdToken: cognitoIdToken,
        } as CustomAxiosRequestConfig);


        if (response.status === 200) {
            logger.info(`GET /stream OK`, LOG_PREFIX, { color: LogColor.YELLOW_BRIGHT });
            return response
        } else {
            logger.error(`GET /stream FAILED. Status: ${response.status}`, LOG_PREFIX);
            return response
        }
    } catch (error: any) {

        if(axios.isAxiosError(error) && error.response) {
            logger.error(
                `GET /stream FAILED: ${error.message}`,
                LOG_PREFIX
            );
            throw {status: error.response.status, message: error.response.data}
        } else {
            logger.error(`GET /stream FAILED: unexpected error:  ${error.message}`, LOG_PREFIX);
            throw {status: 500, message: error.message};
        }
    }
}
