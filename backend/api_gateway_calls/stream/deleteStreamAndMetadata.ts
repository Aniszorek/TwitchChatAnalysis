import {apiGatewayClient} from "../apiGatewayConfig";
import {logger} from "../../utilities/logger";

const LOG_PREFIX = `API_GATEWAY_REST`;


export async function deleteStreamAndMetadataFromApiGateway(queryParams: any, headers: any) {
    try {
        return await apiGatewayClient.delete('/stream', {
                headers: {
                    ...headers,
                },
                params: {
                    ...queryParams
                }
            })

    } catch (error: any) {
        logger.error(`Error deleting stream data: ${error.message}`, LOG_PREFIX);
        throw error;
    }
}