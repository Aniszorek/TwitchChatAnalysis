import {apiGatewayClient} from "../apiGatewayConfig";
import {logger} from "../../utilities/logger";

const LOG_PREFIX = `API_GATEWAY_REST`;

export async function getTwitchMessageFromApiGateway(queryParams: any, headers: any) {
    try {

        return await apiGatewayClient.get('/twitch-message',{
            headers: {
                ...headers
            },
            params: {
                ...queryParams,
            }
        })
    } catch (error: any) {
        logger.error(`Error fetching twitch messages: ${error.message}`, LOG_PREFIX);
        throw error;
    }
}