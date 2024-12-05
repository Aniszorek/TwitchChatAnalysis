import {getClientAndCognitoIdToken} from "../../bot/frontendClients";
import {apiGatewayClient, CustomAxiosRequestConfig} from "../apiGatewayConfig";
import {LogColor, logger} from "../../utilities/logger";
import axios from "axios";

const LOG_PREFIX = `API_GATEWAY_REST`;

export interface GetTwitchMessageOptions {
    stream_id?: string;
    start_time?: string;
    end_time?: string;
    chatter_user_login?: string;
}

export interface GetTwitchMessageResponse {
    stream_id: string,
    broadcaster_user_login: string,
    chatter_user_login: string,
    message_text: string,
    nlp_classification: string,
    timestamp: string
}

export async function getTwitchMessageFromApiGateway(cognitoIdToken: string, broadcasterUsername: string, options: GetTwitchMessageOptions) {
    try {

        // required
        if (!cognitoIdToken) {
            throw new Error(`Missing cognitoIdToken`);
        }
        if (!broadcasterUsername) {
            throw new Error(`missing broadcasterUsername for cognitoIdToken: ${cognitoIdToken}`);
        }

        const response = await apiGatewayClient.get('/twitch-message',{
            broadcasterUserLogin: broadcasterUsername,
            cognitoIdToken: cognitoIdToken,
            params: {
                ...options
            }
        } as CustomAxiosRequestConfig)

        if (response.status === 200) {
            logger.info(`GET /twitch-message OK`, LOG_PREFIX, {color: LogColor.YELLOW_BRIGHT});
            return response

        } else {
            logger.error(`GET /twitch-message FAILED. Status: ${response.status}`, LOG_PREFIX);
            return response
        }
    }catch (error: any) {

        if(axios.isAxiosError(error) && error.response) {
            logger.error(`GET /twitch-message FAILED: ${error.message}`, LOG_PREFIX);
            throw {status: error.response.status, message: error.response.data}

        } else {
            logger.error(`GET /twitch-message FAILED: unexpected error:  ${error.message}`, LOG_PREFIX);
            throw {status: 500, message: error.message};
        }
    }
}