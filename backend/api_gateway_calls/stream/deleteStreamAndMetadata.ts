import {apiGatewayClient} from "../apiGatewayConfig";
import {logger} from "../../utilities/logger";
import {DeleteStreamMetadataResponse} from "../../routes/aws/model/deleteStreamMetadataResponse";

const LOG_PREFIX = `API_GATEWAY_REST`;


export async function deleteStreamAndMetadataFromApiGateway(queryParams: any, headers: any):Promise<DeleteStreamMetadataResponse> {
    try {
        const response = await apiGatewayClient.delete('/stream', {
                headers: {
                    ...headers,
                },
                params: {
                    ...queryParams
                }
            })
        return response.data

    } catch (error: any) {
        logger.error(`Error deleting stream data: ${error.message}`, LOG_PREFIX);
        throw error;
    }
}