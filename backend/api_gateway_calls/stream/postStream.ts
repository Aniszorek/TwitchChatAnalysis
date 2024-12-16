import {apiGatewayClient} from "../apiGatewayConfig";
import {logger} from "../../utilities/logger";
import {PostStreamPayload} from "../../routes/aws/model/postStreamPayload";

const LOG_PREFIX = `API_GATEWAY_REST`;


export async function postStreamToApiGateway(streamMessage: PostStreamPayload, headers: any) {

    try {
        return await apiGatewayClient.post('/stream', streamMessage, {
            headers: {
                ...headers
            }
        })
    }catch (error: any) {
        logger.error(`Error sending stream to API Gateway: ${error.message}`, LOG_PREFIX);
        throw error
    }
}