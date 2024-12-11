import express from "express";
import {logger} from "../../utilities/logger";
import {getStreamsByBroadcasterUsernameFromApiGateway} from "../../api_gateway_calls/stream/getStreamByBroadcaster";
import {getStreamFromApiGateway, GetStreamMessage} from "../../api_gateway_calls/stream/getStream";
import {extractHeaders, extractQueryParams} from "../../utilities/utilities";
import {deleteStreamAndMetadataFromApiGateway} from "../../api_gateway_calls/stream/deleteStreamAndMetadata";

export const awsStreamRouter = express.Router();

const LOG_PREFIX = 'AWS_API_STREAM';

awsStreamRouter.get('/', async (req, res) => {
    const broadcasterUsername = req.headers['broadcasteruserlogin'] as string | undefined;
    let cognitoIdToken = req.headers['authorization'] as string | undefined;
    const streamId = req.query.stream_id as string | undefined;

    if (!broadcasterUsername) {
        return res.status(400).json({ error: 'Missing required header: broadcasteruserlogin' });
    }

    if (!cognitoIdToken) {
        return res.status(400).json({ error: 'Missing required header: authorization' });
    }

    if (cognitoIdToken.startsWith('Bearer ')) {
        cognitoIdToken = cognitoIdToken.slice(7);
    }

    try {
        const result = streamId ? await getStreamFromApiGateway(cognitoIdToken, streamId, broadcasterUsername)
            : await getStreamsByBroadcasterUsernameFromApiGateway(cognitoIdToken, broadcasterUsername);

        if(result.status == 200)
        {
            res.status(200).json(Array.isArray(result.data)
                ? (result.data as GetStreamMessage[])
                : [])
        }
        else
        {
            res.status(result.status).json({
                data: result.data || null,
            })
        }

    } catch (error: any) {

        if(error.status && error.message) {
            logger.error(
                `Error in /aws/stream route: ${JSON.stringify(error.message)}, status: ${error.status}`,
                LOG_PREFIX
            );
            res.status(error.status).json(error.message);
        }
        else {
            logger.error(
                `Unexpected error in /aws/stream route: ${error.message || 'Unknown error'}`,
                LOG_PREFIX
            );
            res.status(500).json({ error: `Failed to GET stream data: ${error.message || 'Unknown error'}` });
        }
    }

});

awsStreamRouter.delete('/', async (req, res) => {

    const headers = extractHeaders(req, ["authorization", "broadcasteruserlogin"])
    const broadcasterUsername = headers.broadcasteruserlogin as string
    let cognitoIdToken = headers.authorization as string

    const queryParams = extractQueryParams(req, ["stream_id"]);
    const streamId = queryParams.stream_id as string

    if (cognitoIdToken.startsWith('Bearer ')) {
        cognitoIdToken = cognitoIdToken.slice(7);
    }

    try {
        const result = await deleteStreamAndMetadataFromApiGateway(cognitoIdToken, streamId, broadcasterUsername)
        res.status(result.status).send(result.data)

    } catch (error: any) {

        if(error.status && error.message) {
            logger.error(
                `Error in DELETE /aws/stream route: ${JSON.stringify(error.message)}, status: ${error.status}`,
                LOG_PREFIX
            );
            res.status(error.status).json(error.message);
        }
        else {
            logger.error(
                `Unexpected error in DELETE /aws/stream route: ${error.message || 'Unknown error'}`,
                LOG_PREFIX
            );
            res.status(500).json({ error: `Failed to DELETE stream data: ${error.message || 'Unknown error'}` });
        }
    }

});
