import {TCASecured} from "../../../utilities/TCASecuredDecorator";
import express from "express";
import {LogColor, logger, LogStyle} from "../../../utilities/logger";
import {IS_DEBUG_ENABLED} from "../../../entryPoint";
import {getStreamFromApiGateway} from "../../../api_gateway_calls/stream/getStream";
import {getStreamsByBroadcasterUsernameFromApiGateway} from "../../../api_gateway_calls/stream/getStreamByBroadcaster";
import {deleteStreamAndMetadataFromApiGateway} from "../../../api_gateway_calls/stream/deleteStreamAndMetadata";
import {getClientAndCognitoIdToken} from "../../../websocket/frontendClients";
import {createTimestamp} from "../../../utilities/utilities";
import {PatchStreamPayload} from "../model/patchStreamPayload";
import {patchStreamToApiGateway} from "../../../api_gateway_calls/stream/patchStream";
import {PostStreamPayload} from "../model/postStreamPayload";
import {postStreamToApiGateway} from "../../../api_gateway_calls/stream/postStream";
import {COGNITO_ROLES} from "../../../utilities/CognitoRoleEnum";

const LOG_PREFIX = "AWS_STREAM_CONTROLLER"

class AwsStreamController {

    @TCASecured({
        optionalQueryParams: ["stream_id"],
        requiredHeaders: ["authorization", "broadcasteruserlogin"],
        requiredRole: COGNITO_ROLES.MODERATOR,
        actionDescription: "Get Stream Metadata"
    })
    public async getStream(req: express.Request, res: express.Response, next: express.NextFunction, context: any) {
        const {optionalQueryParams, headers} = context;
        const stream_id = optionalQueryParams.stream_id;
        try {
            const result = stream_id ? await getStreamFromApiGateway(optionalQueryParams, headers)
                : await getStreamsByBroadcasterUsernameFromApiGateway(headers);

            logger.info(`Successfully get stream ${stream_id ? "by broadcaster" : ""}`, LOG_PREFIX, { color: LogColor.YELLOW, style: LogStyle.DIM });
            res.json(result);

        } catch (error: any) {
            logger.error(`Error in get /stream: ${error.message}. ${IS_DEBUG_ENABLED ? JSON.stringify(error.response.data, null, 2) : ""}`, LOG_PREFIX);
            res.status(error.response.status).json({
                error: `Failed to fetch stream: ${JSON.stringify(error.response.data)}`,
            });
        }
    }

    @TCASecured({
        requiredQueryParams: ["stream_id"],
        requiredHeaders: ["authorization", "broadcasteruserlogin"],
        requiredRole: COGNITO_ROLES.MODERATOR,
        actionDescription: "Delete Stream Metadata"
    })
    public async deleteStream(req: express.Request, res: express.Response, next: express.NextFunction, context: any) {
        const {queryParams, headers} = context;
        try {
            const result = await deleteStreamAndMetadataFromApiGateway(queryParams, headers)
            res.json(result)

        } catch (error: any) {
            logger.error(`Error in delete /stream: ${error.message}. ${IS_DEBUG_ENABLED ? JSON.stringify(error.response.data, null, 2) : ""}`, LOG_PREFIX);
            res.status(error.response.status).json({
                error: `Failed to delete stream data: ${JSON.stringify(error.response.data)}`,
            });
        }
    }

    // for internal use only
    public async postStream(cognitoUserId: string) {
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

            const streamMessage: PostStreamPayload = {
                stream_id: stream_id,
                broadcaster_username: broadcasterUsername,
                stream_title: streamTitle,
                started_at: startedAt,
                start_follows: startFollows,
                start_subs: startSubs
            }
            const headers = {
                broadcasteruserlogin: broadcasterUsername,
                authorization: 'Bearer ' + cognitoIdToken
            }

            const response = await postStreamToApiGateway(streamMessage, headers)
            logger.info(`Stream sent to API Gateway: ${IS_DEBUG_ENABLED ? JSON.stringify(streamMessage, null, 2): ""}`, LOG_PREFIX);
            return response
        } catch (error: any) {
            logger.error(`Failed to stream to API Gateway: ${error.message}`, LOG_PREFIX);
        }
    }

    // for internal use only
    public async patchStream(cognitoUserId: string)
    {
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

            const streamMessage: PatchStreamPayload = {
                stream_id: stream_id,
                ended_at: ended_at,
                end_follows: end_follows,
                end_subs: end_subs
            }
            const headers = {
                broadcasteruserlogin: broadcasterUsername,
                authorization: 'Bearer ' + cognitoIdToken
            }

            const response = await patchStreamToApiGateway(streamMessage, headers)
            logger.info(`Stream updated to API Gateway: ${IS_DEBUG_ENABLED ? JSON.stringify(streamMessage, null, 2) : ""}`, LOG_PREFIX);
            return response
        } catch (error: any) {
            logger.error(`Failed to update stream to API Gateway: ${error.message}`, LOG_PREFIX);
        }
    }

}

export const awsStreamController = new AwsStreamController