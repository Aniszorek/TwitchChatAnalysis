import {apiGatewayClient} from "../apiGatewayConfig";
import {logger} from "../../utilities/logger";
import {PatchStreamPayload} from "../../routes/aws/model/patchStreamPayload";

const LOG_PREFIX = `API_GATEWAY_REST`;

export async function patchStreamToApiGateway(streamMessage: PatchStreamPayload, headers: any) {

    try {
        return await apiGatewayClient.patch('/stream', streamMessage, {
            headers: {
                ...headers
            }
        })
    } catch (error: any) {
        logger.error(`Error updating stream to API Gateway: ${error.message}`, LOG_PREFIX);
        throw error
    }
}