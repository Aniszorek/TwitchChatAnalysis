import {
    getClientAndCognitoIdToken,
    getFrontendClientTwitchStreamMetadata,
    refreshStreamMetadataCounters,
    setFrontendClientTwitchStreamMetadata,
    TwitchStreamMetadata
} from "../../bot/frontendClients";
import {createTimestamp} from "../../utilities/utilities";
import {fetchTwitchStreamMetadata, TwitchStreamData} from "../../twitch_calls/twitchAuth";
import {apiGatewayClient, CustomAxiosRequestConfig} from "../apiGatewayConfig";
import {logger} from "../../utilities/logger";

const LOG_PREFIX = `API_GATEWAY_REST: `;
export const METADATA_SEND_INTERVAL = 10 * 1000

interface StreamMetadataMessage {
    stream_id: string,
    timestamp: string,
    viewer_count?: number,
    category?: string,
    follower_count?: number,
    subscriber_count?: number,
    message_count?: number,
    positive_message_count?: number,
    negative_message_count?: number,
    neutral_message_count?: number
}

export async function postMetadataToApiGateway(cognitoUserId: string) {

    try {
        const {client, cognitoIdToken} = getClientAndCognitoIdToken(cognitoUserId)

        // required:
        const stream_id = client.twitchData.streamId
        const timestamp = createTimestamp()
        const broadcasterUserLogin = client.twitchData.twitchBroadcasterUsername
        const broadcasterId = client.twitchData.twitchBroadcasterUserId;


        if (!stream_id) {
            throw new Error(`missing stream_id for cognitoUserId: ${cognitoUserId}`);
        }
        if (!broadcasterUserLogin) {
            throw new Error(`missing broadcasterUserLogin for cognitoUserId: ${cognitoUserId}`);
        }

        if (!broadcasterId) {
            throw new Error(`broadcasterId not found for cognitoUserId: ${cognitoUserId}`);
        }

        // fetch current streamStatus (category, title, viewerCount)
        const streamStatus: TwitchStreamData = await fetchTwitchStreamMetadata(broadcasterId);
        if (streamStatus.stream_id === stream_id) {
            const oldMetadata = getFrontendClientTwitchStreamMetadata(cognitoUserId)
            const newMetadata: TwitchStreamMetadata = {
                title: streamStatus.title,
                category: streamStatus.category,
                viewerCount: streamStatus.viewer_count,
                followersCount: oldMetadata?.followersCount,
                subscriberCount: oldMetadata?.subscriberCount,
                messageCount: oldMetadata?.messageCount,
                positiveMessageCount: oldMetadata?.positiveMessageCount,
                negativeMessageCount: oldMetadata?.negativeMessageCount,
                neutralMessageCount: oldMetadata?.neutralMessageCount
            }
            setFrontendClientTwitchStreamMetadata(cognitoUserId, newMetadata)
        }

        const metadata: StreamMetadataMessage = {
            stream_id: stream_id,
            timestamp: timestamp,
            viewer_count: client.twitchData.streamMetadata.viewerCount,
            category: client.twitchData.streamMetadata.category,
            follower_count: client.twitchData.streamMetadata.followersCount,
            subscriber_count: client.twitchData.streamMetadata.subscriberCount,
            message_count: client.twitchData.streamMetadata.messageCount,
            positive_message_count: client.twitchData.streamMetadata.positiveMessageCount,
            negative_message_count: client.twitchData.streamMetadata.negativeMessageCount,
            neutral_message_count: client.twitchData.streamMetadata.neutralMessageCount
        }

        const response = await apiGatewayClient.post('/stream-metadata', metadata, {
                broadcasterUserLogin: broadcasterUserLogin,
                cognitoIdToken: cognitoIdToken,
            } as CustomAxiosRequestConfig)

        if (response.status === 200) {
            logger.info(`Metadata sent to API Gateway: ${JSON.stringify(metadata, null, 2)}`, LOG_PREFIX);

        } else {
            logger.error(`Failed to send metadata to API Gateway. Status: ${response.status}`, LOG_PREFIX);
        }


    } catch (error: any) {
        logger.error(`Error sending metadata to API Gateway: ${error.message}`, LOG_PREFIX);
    } finally {
        refreshStreamMetadataCounters(cognitoUserId);
    }
}