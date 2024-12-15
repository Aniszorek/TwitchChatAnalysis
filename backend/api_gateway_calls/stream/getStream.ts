import {apiGatewayClient} from "../apiGatewayConfig";
import {logger} from "../../utilities/logger";
import {GetStreamMessage} from "../../routes/aws/model/getStreamMessageResponse";

const LOG_PREFIX = `API_GATEWAY_REST`;

export async function getStreamFromApiGateway(queryParams: any, headers: any) {
    try {

        const response = await apiGatewayClient.get('/stream',{
            headers:{
              ...headers
            },
            params: {
                ...queryParams
            }
        })

        const result:GetStreamMessage = response.data
        return result

    } catch (error: any) {
        logger.error(`Error fetching stream: ${error.message}`, LOG_PREFIX);
        throw error;
    }
}