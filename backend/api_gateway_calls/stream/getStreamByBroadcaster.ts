import {getClientAndCognitoIdToken} from "../../bot/frontendClients";
import {apiGatewayClient, CustomAxiosRequestConfig} from "../apiGatewayConfig";

const LOG_PREFIX = `API_GATEWAY_REST:`;

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
            console.log(`${LOG_PREFIX} GET /stream/stream_id OK`);
            return Array.isArray(response.data)
                ? (response.data as GetStreamMessage[])
                : [];

        } else {
            console.error(`${LOG_PREFIX} GET /stream/stream_id FAILED. Status: ${response.status}`);
            return [];
        }
    }catch (error: any) {
        console.error(`${LOG_PREFIX} GET /stream/stream_id FAILED: ${error.message}`);
        return [];
    }
}