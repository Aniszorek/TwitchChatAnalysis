import {apiGatewayClient} from "../apiGatewayConfig";
import {logger} from "../../utilities/logger";
import {PostStreamMetadataPayload} from "../../routes/aws/model/postStreamMetadataPayload";

const LOG_PREFIX = `API_GATEWAY_REST`;
const MINUTES = 5
const SECONDS = 60
const MILLISECONDS = 1000
export const METADATA_SEND_INTERVAL = MINUTES * SECONDS * MILLISECONDS

export async function postMetadataToApiGateway(metadata: PostStreamMetadataPayload, headers: any) {

    try {
        return await apiGatewayClient.post('/stream-metadata', metadata, {
                headers: {
                    ...headers,
                }
            })

    } catch (error: any) {
        logger.error(`Error sending metadata to API Gateway: ${error.message}`, LOG_PREFIX);
        throw error
    }
}