import {apiGatewayClient} from "../apiGatewayConfig";
import {logger} from "../../utilities/logger";
import {GetStreamMetadataResponse} from "../../routes/aws/model/getStreamMetadataResponse";

const LOG_PREFIX = `API_GATEWAY_REST`;

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

        const result:GetStreamMetadataResponse = response.data
        return result

    } catch (error: any) {
        logger.error(`Error fetching stream-metadata: ${error.message}`, LOG_PREFIX);
        throw error;
    }
}