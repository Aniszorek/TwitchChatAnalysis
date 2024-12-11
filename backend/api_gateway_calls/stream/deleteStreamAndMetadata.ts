import {apiGatewayClient, CustomAxiosRequestConfig} from "../apiGatewayConfig";
import {logger} from "../../utilities/logger";
import axios from "axios";

const LOG_PREFIX = `API_GATEWAY_REST`;


export async function deleteStreamAndMetadataFromApiGateway(cognitoIdToken: string, stream_id: string, broadcasterUsername: string) {
    try {

        return await apiGatewayClient.delete('/stream', {
                broadcasterUserLogin: broadcasterUsername,
                cognitoIdToken: cognitoIdToken,
                params: {
                    stream_id: stream_id
                }
            } as CustomAxiosRequestConfig)

    }catch (error: any) {

        if(axios.isAxiosError(error) && error.response) {
            logger.error(`DELETE /stream FAILED: ${error.message}`, LOG_PREFIX);
            throw {status: error.response.status, message: error.response.data}

        } else {
            logger.error(`DELETE /stream FAILED: unexpected error:  ${error.message}`, LOG_PREFIX);
            throw {status: 500, message: error.message};
        }
    }
}