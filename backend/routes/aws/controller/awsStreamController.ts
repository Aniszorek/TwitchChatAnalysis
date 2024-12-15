import {TCASecured} from "../../../utilities/TCASecuredDecorator";
import {COGNITO_ROLES} from "../../../cognitoRoles";
import express from "express";
import {LogColor, logger, LogStyle} from "../../../utilities/logger";
import {IS_DEBUG_ENABLED} from "../../../entryPoint";
import {getStreamFromApiGateway} from "../../../api_gateway_calls/stream/getStream";
import {getStreamsByBroadcasterUsernameFromApiGateway} from "../../../api_gateway_calls/stream/getStreamByBroadcaster";
import {deleteStreamAndMetadataFromApiGateway} from "../../../api_gateway_calls/stream/deleteStreamAndMetadata";

const LOG_PREFIX = "AWS_STREAM_CONTROLLER"

class AwsStreamController {

    @TCASecured({
        optionalQueryParams: ["stream_id"],
        requiredHeaders: ["authorization", "broadcasteruserlogin"],
        requiredRole: COGNITO_ROLES.MODERATOR,
        actionDescription: "Get Stream Metadata"
    })
    public async getStream(req: express.Request, res: express.Response, next: express.NextFunction, context: any) {
        const {optionalQueryParams, headers, validatedBody} = context;
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
        const {queryParams, headers, validatedBody} = context;
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
}

export const awsStreamController = new AwsStreamController