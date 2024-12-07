import {getClientAndCognitoIdToken} from "../../bot/frontendClients";
import {createTimestamp} from "../../utilities/utilities";
import {apiGatewayClient, CustomAxiosRequestConfig} from "../apiGatewayConfig";
import {logger} from "../../utilities/logger";

const LOG_PREFIX = `API_GATEWAY_REST`;

interface PatchStreamMessage {
    stream_id: string,
    ended_at?: string,
    end_follows?: number,
    end_subs?: number
}

export async function patchStreamToApiGateway(cognitoUserId: string) {

    try {
        const {client, cognitoIdToken} = getClientAndCognitoIdToken(cognitoUserId)

        // required
        const stream_id = client.twitchData.streamId
        const broadcasterUsername = client.twitchData.twitchBroadcasterUsername


        // optional
        const ended_at = encodeURIComponent(createTimestamp())
        const end_follows = client.twitchData.streamData.endFollows
        const end_subs = client.twitchData.streamData.endSubs

        if (!stream_id) {
            throw new Error(`missing stream_id for cognitoUserId: ${cognitoUserId}`);
        }
        if (!broadcasterUsername) {
            throw new Error(`missing broadcasterUsername for cognitoUserId: ${cognitoUserId}`);
        }

        const streamMessage: PatchStreamMessage = {
            stream_id: stream_id,
            ended_at: ended_at,
            end_follows: end_follows,
            end_subs: end_subs
        }

        const response = await apiGatewayClient.patch('/stream', streamMessage, {
            broadcasterUserLogin: broadcasterUsername,
            cognitoIdToken: cognitoIdToken,
        } as CustomAxiosRequestConfig)

        if (response.status === 200) {
            logger.info(`Stream updated to API Gateway: ${JSON.stringify(streamMessage, null, 2)}`, LOG_PREFIX);

        } else {
            logger.error(`Failed to update stream to API Gateway. Status: ${response.status}`, LOG_PREFIX);
        }
    }catch (error: any) {
        logger.error(`Error updating stream to API Gateway: ${error.message}`, LOG_PREFIX);
    }
}