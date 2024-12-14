import {TCASecured} from "../../../utilities/TCASecuredDecorator";
import {COGNITO_ROLES} from "../../../cognitoRoles";
import express from "express";
import {
    getStreamMetadataByStreamIdFromApiGateway
} from "../../../api_gateway_calls/stream-metadata/getStreamMetadataByStreamId";
import {LogColor, logger, LogStyle} from "../../../utilities/logger";
import {IS_DEBUG_ENABLED} from "../../../entryPoint";

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
}

export const awsStreamMetadataController = new AwsStreamMetadataController();