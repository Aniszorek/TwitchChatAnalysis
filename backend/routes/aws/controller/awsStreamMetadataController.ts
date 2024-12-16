import {TCASecured} from "../../../utilities/TCASecuredDecorator";
import express from "express";
import {
    getStreamMetadataByStreamIdFromApiGateway
} from "../../../api_gateway_calls/stream-metadata/getStreamMetadataByStreamId";
import {LogColor, logger, LogStyle} from "../../../utilities/logger";
import {IS_DEBUG_ENABLED} from "../../../entryPoint";
import {
    getClientAndCognitoIdToken,
    getFrontendClientTwitchStreamMetadata,
    refreshStreamMetadataCounters,
    setFrontendClientTwitchStreamMetadata,
    TwitchStreamMetadata
} from "../../../bot/frontendClients";
import {createTimestamp} from "../../../utilities/utilities";
import {PostStreamMetadataPayload} from "../model/postStreamMetadataPayload";
import {postMetadataToApiGateway} from "../../../api_gateway_calls/stream-metadata/postStreamMetadata";
import {COGNITO_ROLES} from "../../../utilities/CognitoRoleEnum";
import {FetchTwitchStreamData} from "../../twitch/model/fetchTwitchStreamDataResponse";
import {twitchStreamsController} from "../../twitch/controller/twitchStreamsController";

const LOG_PREFIX = "AWS_STREAM_METADATA_CONTROLLER"

class AwsStreamMetadataController {

    @TCASecured({
        requiredQueryParams: ["stream_id"],
        requiredHeaders: ["authorization", "broadcasteruserlogin"],
        requiredRole: COGNITO_ROLES.MODERATOR,
        actionDescription: "Get Stream Metadata"
    })
    public async getStreamMetadata(req: express.Request, res: express.Response, next: express.NextFunction, context: any) {
        const {queryParams, headers, validatedBody} = context;
        try{

            const result =  await getStreamMetadataByStreamIdFromApiGateway(queryParams, headers)
            logger.info("Successfully get stream-metadata", LOG_PREFIX, { color: LogColor.YELLOW, style: LogStyle.DIM });
            res.json(result);
        }
        catch (error: any) {
            logger.error(`Error in get /stream-metadata: ${error.message}. ${IS_DEBUG_ENABLED ? JSON.stringify(error.response.data, null, 2) : ""}`, LOG_PREFIX);
            res.status(error.response.status).json({
                error: `Failed to fetch stream-metadata: ${JSON.stringify(error.response.data)}`,
            });
        }
    }

    // for internal use only
    public async postStreamMetadata(cognitoUserId: string) {
        try {
            const {client, cognitoIdToken} = getClientAndCognitoIdToken(cognitoUserId)

            // required:
            const stream_id = client.twitchData.streamId
            const timestamp = encodeURIComponent(createTimestamp())
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
            const streamStatus: FetchTwitchStreamData = await twitchStreamsController.fetchTwitchStreamMetadata(broadcasterId);
            if (streamStatus.stream_id === stream_id) {
                const oldMetadata = getFrontendClientTwitchStreamMetadata(cognitoUserId)
                const newMetadata: TwitchStreamMetadata = {
                    title: streamStatus.title,
                    category: streamStatus.category,
                    viewerCount: streamStatus.viewer_count,
                    followersCount: oldMetadata?.followersCount,
                    subscriberCount: oldMetadata?.subscriberCount,
                    messageCount: oldMetadata?.messageCount,
                    veryNegativeMessageCount: oldMetadata?.veryNegativeMessageCount,
                    negativeMessageCount: oldMetadata?.negativeMessageCount,
                    slightlyNegativeMessageCount: oldMetadata?.slightlyNegativeMessageCount,
                    neutralMessageCount: oldMetadata?.neutralMessageCount,
                    slightlyPositiveMessageCount: oldMetadata?.slightlyPositiveMessageCount,
                    positiveMessageCount: oldMetadata?.positiveMessageCount,
                    veryPositiveMessageCount: oldMetadata?.veryPositiveMessageCount
                }
                setFrontendClientTwitchStreamMetadata(cognitoUserId, newMetadata)
            }

            const metadata: PostStreamMetadataPayload = {
                stream_id: stream_id,
                timestamp: timestamp,
                viewer_count: client.twitchData.streamMetadata.viewerCount,
                category: client.twitchData.streamMetadata.category,
                follower_count: client.twitchData.streamMetadata.followersCount,
                subscriber_count: client.twitchData.streamMetadata.subscriberCount,
                message_count: client.twitchData.streamMetadata.messageCount,
                very_negative_message_count: client.twitchData.streamMetadata.veryNegativeMessageCount,
                negative_message_count: client.twitchData.streamMetadata.negativeMessageCount,
                slightly_negative_message_count: client.twitchData.streamMetadata.slightlyNegativeMessageCount,
                neutral_message_count: client.twitchData.streamMetadata.neutralMessageCount,
                slightly_positive_message_count: client.twitchData.streamMetadata.slightlyPositiveMessageCount,
                positive_message_count: client.twitchData.streamMetadata.positiveMessageCount,
                very_positive_message_count: client.twitchData.streamMetadata.veryPositiveMessageCount
            }
            const headers = {
                broadcasteruserlogin: broadcasterUserLogin,
                authorization: 'Bearer ' + cognitoIdToken
            }

            const response = await postMetadataToApiGateway(metadata, headers)
            logger.info(`Metadata sent to API Gateway: ${IS_DEBUG_ENABLED ? JSON.stringify(metadata, null, 2) : ""}`, LOG_PREFIX);
            return response

        } catch (error: any) {
            logger.error(`Failed to send stream metadata to Api Gateway: ${error.message}`, LOG_PREFIX);
        } finally {
            refreshStreamMetadataCounters(cognitoUserId);
        }
    }
}

export const awsStreamMetadataController = new AwsStreamMetadataController();