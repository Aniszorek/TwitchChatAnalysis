import {apiGatewayClient} from "../apiGatewayConfig";
import {logger} from "../../utilities/logger";

const LOG_PREFIX = `API_GATEWAY_REST`;

export interface GetStreamMetadataMessage {
    "stream_id": string,
    "timestamp": string,
    "metadata": StreamMetadata
}

interface StreamMetadata {
    "category"?: string
    "viewer_count"?: number
    "message_count"?: number
    "follower_count"?: number
    "subscriber_count"?: number
    "neutral_message_count"?: number
    "negative_message_count"?: number
    "positive_message_count"?: number
}

export async function getStreamMetadataByStreamIdFromApiGateway(queryParams: any, headers: any) {
    try {
         const response = await apiGatewayClient.get('/stream-metadata',{
            params: {
                ...queryParams
            },
             headers: {
                ...headers
             }
        })

        const result:GetStreamMetadataMessage = response.data
        return result

    } catch (error: any) {
        logger.error(`Error fetching stream-metadata: ${error.message}`, LOG_PREFIX);
        throw error;
    }
}