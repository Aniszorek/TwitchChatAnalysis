import {apiGatewayClient} from "../apiGatewayConfig";
import {logger} from "../../utilities/logger";

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

export async function getStreamFromApiGateway(queryParams: any, headers: any) {
    try {

        const response = await apiGatewayClient.get('/stream',{
            headers:{
              ...headers
            },
            params: {
                ...queryParams
            }
        })

        const result:GetStreamMessage = response.data
        return result

    } catch (error: any) {
        logger.error(`Error fetching stream: ${error.message}`, LOG_PREFIX);
        throw error;
    }
}