import {getClientAndCognitoIdToken} from "../../bot/frontendClients";
import {apiGatewayClient, CustomAxiosRequestConfig} from "../apiGatewayConfig";
import {LogColor, logger} from "../../utilities/logger";
import axios from "axios";

const LOG_PREFIX = `API_GATEWAY_REST`;

export interface GetStreamMessage {
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

export async function getStreamFromApiGateway(cognitoIdToken: string, stream_id: string, broadcasterUsername: string) {
    try {

        // required
        if (!cognitoIdToken) {
            throw new Error(`Missing cognitoIdToken`);
        }
        if (!stream_id) {
            throw new Error(`missing stream_id for cognitoIdToken: ${cognitoIdToken}`);
        }
        if (!broadcasterUsername) {
            throw new Error(`missing broadcasterUsername for cognitoIdToken: ${cognitoIdToken}`);
        }

        const response = await apiGatewayClient.get('/stream',{
            broadcasterUserLogin: broadcasterUsername,
            cognitoIdToken: cognitoIdToken,
            params: {
                stream_id: stream_id
            }
        } as CustomAxiosRequestConfig)

        if (response.status === 200) {
            logger.info(`GET /stream/stream_id OK`, LOG_PREFIX, {color: LogColor.YELLOW_BRIGHT});
            return response

        } else {
            logger.error(`GET /stream/stream_id FAILED. Status: ${response.status}`, LOG_PREFIX);
            return response
        }
    }catch (error: any) {

        if(axios.isAxiosError(error) && error.response) {
            logger.error(`GET /stream/stream_id FAILED: ${error.message}`, LOG_PREFIX);
            throw {status: error.response.status, message: error.response.data}

        } else {
            logger.error(`GET /stream/stream_id FAILED: unexpected error:  ${error.message}`, LOG_PREFIX);
            throw {status: 500, message: error.message};
        }
    }
}