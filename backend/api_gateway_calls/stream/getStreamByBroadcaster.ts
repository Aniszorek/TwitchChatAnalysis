import {apiGatewayClient} from "../apiGatewayConfig";
import {logger} from "../../utilities/logger";
import {GetStreamMessage} from "../../routes/aws/model/getStreamMessageResponse";

const LOG_PREFIX = `API_GATEWAY_REST`;

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
