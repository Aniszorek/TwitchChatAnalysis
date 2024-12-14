import {apiGatewayClient} from "../apiGatewayConfig";
import {logger} from "../../utilities/logger";

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

export async function getStreamsByBroadcasterUsernameFromApiGateway(headers: any) {
    try {

        const response = await apiGatewayClient.get('/stream', {
            headers: {
                ...headers
            }
        });

        const result:GetStreamMessage = response.data
        return result

    } catch (error: any) {
        logger.error(`Error fetching all streams by broadcaster: ${error.message}`, LOG_PREFIX);
        throw error;
    }
}
