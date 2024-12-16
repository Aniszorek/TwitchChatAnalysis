import {logger} from "../../utilities/logger";
import {IS_DEBUG_ENABLED} from "../../entryPoint";
import {ValidateUserRoleResponse} from "../../routes/aws/model/validateUserRoleResponse";
import {apiGatewayClient} from "../apiGatewayConfig";

const LOG_PREFIX = `API_GATEWAY_REST`;


export async function validateUserRole(requestBody:any, headers: any): Promise<ValidateUserRoleResponse> {
    try {

        const response= await apiGatewayClient.post('/twitchChatAnalytics-authorization', {
            ...requestBody,
        }, {
            headers: {
                ...headers
            }
        })
        return response.data;

    } catch (error: any) {
        logger.error(`Error sending message to API Gateway: ${IS_DEBUG_ENABLED ? JSON.stringify(error, null, 2): ""}`, LOG_PREFIX);
        throw error
    }
}