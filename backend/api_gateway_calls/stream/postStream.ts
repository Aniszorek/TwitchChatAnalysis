import {getClientAndCognitoIdToken} from "../../bot/frontendClients";
import {apiGatewayClient, CustomAxiosRequestConfig} from "../apiGatewayConfig";

const LOG_PREFIX = `API_GATEWAY_REST:`;

interface PostStreamMessage {
    stream_id: string,
    broadcaster_username: string,
    stream_title: string,
    started_at: string,
    start_follows: number,
    start_subs: number,
    ended_at?: string,
    end_follows?: number,
    end_subs?: number
}


export async function postStreamToApiGateway(cognitoUserId: string) {

    try {
        const {client, cognitoIdToken} = getClientAndCognitoIdToken(cognitoUserId)

        // required
        const stream_id = client.twitchData.streamId
        const broadcasterUsername = client.twitchData.twitchBroadcasterUsername
        const streamTitle = client.twitchData.streamMetadata.title
        const startedAt = client.twitchData.streamData.startedAt
        const startFollows = client.twitchData.streamData.startFollows
        const startSubs = client.twitchData.streamData.startSubs

        if (!stream_id) {
            throw new Error(`missing stream_id for cognitoUserId: ${cognitoUserId}`);
        }
        if (!broadcasterUsername) {
            throw new Error(`missing broadcasterUsername for cognitoUserId: ${cognitoUserId}`);
        }
        if (!streamTitle) {
            throw new Error(`missing streamTitle for cognitoUserId: ${cognitoUserId}`);
        }
        if (startedAt === undefined) {
            throw new Error(`missing startedAt for cognitoUserId: ${cognitoUserId}`);
        }
        if (!startFollows) {
            throw new Error(`missing startFollows for cognitoUserId: ${cognitoUserId}`);
        }
        if (startSubs === undefined) {
            throw new Error(`missing startSubs for cognitoUserId: ${cognitoUserId}`);
        }

        const streamMessage: PostStreamMessage = {
            stream_id: stream_id,
            broadcaster_username: broadcasterUsername,
            stream_title: streamTitle,
            started_at: startedAt,
            start_follows: startFollows,
            start_subs: startSubs
        }

        const response = await apiGatewayClient.post('/stream', streamMessage, {
                broadcasterUserLogin: broadcasterUsername,
                cognitoIdToken: cognitoIdToken,
        } as CustomAxiosRequestConfig)

        if (response.status === 200) {
            console.log(`${LOG_PREFIX} Stream sent to API Gateway: ${JSON.stringify(streamMessage)}`);

        } else {
            console.error(`${LOG_PREFIX} Failed to send stream to API Gateway. Status: ${response.status}`);
        }
    }catch (error: any) {
        console.error(`${LOG_PREFIX} Error sending stream to API Gateway: ${error.message}`);
    }
}