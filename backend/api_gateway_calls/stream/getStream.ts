import {getClientAndCognitoIdToken} from "../../bot/frontendClients";
import {apiGatewayClient, CustomAxiosRequestConfig} from "../apiGatewayConfig";

const LOG_PREFIX = `API_GATEWAY_REST:`;

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

export async function getStreamFromApiGateway(cognitoUserId: string, stream_id: string) {
    try {
        const {client, cognitoIdToken} = getClientAndCognitoIdToken(cognitoUserId)

        // required
        const broadcasterUsername = client.twitchData.twitchBroadcasterUsername

        if (!stream_id) {
            throw new Error(`missing stream_id for cognitoUserId: ${cognitoUserId}`);
        }
        if (!broadcasterUsername) {
            throw new Error(`missing broadcasterUsername for cognitoUserId: ${cognitoUserId}`);
        }

        const response = await apiGatewayClient.get('/stream',{
            broadcasterUserLogin: broadcasterUsername,
            cognitoIdToken: cognitoIdToken,
            params: {
                stream_id: stream_id
            }
        } as CustomAxiosRequestConfig)

        const result = response.data as GetStreamMessage

        if (response.status === 200) {
            console.log(`${LOG_PREFIX} GET /stream/stream_id OK`);
            return result

        } else {
            console.error(`${LOG_PREFIX} GET /stream/stream_id FAILED. Status: ${response.status}`);
        }
    }catch (error: any) {
        console.error(`${LOG_PREFIX} GET /stream/stream_id FAILED: ${error.message}`);
    }
}