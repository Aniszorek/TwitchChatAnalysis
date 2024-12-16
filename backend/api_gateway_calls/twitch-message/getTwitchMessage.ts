import {apiGatewayClient} from "../apiGatewayConfig";
import {logger} from "../../utilities/logger";
import {TwitchMessageData} from "../../routes/aws/model/getTwitchMessageResponse";

const LOG_PREFIX = `API_GATEWAY_REST`;

export async function getTwitchMessageFromApiGateway(queryParams: any, headers: any):Promise<TwitchMessageData[]> {
    try {

        const response = await apiGatewayClient.get('/twitch-message',{
            headers: {
                ...headers
            },
            params: {
                ...queryParams,
            }
        })
        return response.data

    } catch (error: any) {
        logger.error(`Error fetching twitch messages: ${error.message}`, LOG_PREFIX);
        throw error;
    }
}