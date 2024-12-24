import {apiGatewayClient} from "../apiGatewayConfig";
import {logger} from "../../utilities/logger";
import {PostTwitchMessagePayload} from "../../routes/aws/model/postTwitchMessagePayload";

const LOG_PREFIX = `API_GATEWAY_REST`;

/**
 * Forwards messages from Twitch EventSub to AWS ApiGateway
 */
export async function postMessageToApiGateway(msg: PostTwitchMessagePayload, headers: any) {
    try {

        return await apiGatewayClient.post("/twitch-message", msg, {
            headers: {
                ...headers
            }
        })
    } catch (error: any) {
        logger.error(`Error sending message to API Gateway: ${error.message}`, LOG_PREFIX);
        throw error
    }
}