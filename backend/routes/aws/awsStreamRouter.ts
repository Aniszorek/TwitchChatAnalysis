import express from "express";
import {getChannelFollowersCount} from "../../twitch_calls/twitchChannels/getChannelFollowers";
import {logger} from "../../utilities/logger";
import {getStreamsByBroadcasterUsernameFromApiGateway} from "../../api_gateway_calls/stream/getStreamByBroadcaster";
import {verifyToken} from "../../aws/cognitoAuth";
import {GetStreamMessage} from "../../api_gateway_calls/stream/getStream";
import axios from "axios";

export const awsStreamRouter = express.Router();

const LOG_PREFIX = 'AWS_API_STREAM';

awsStreamRouter.get('/', async (req, res) => {
    const broadcasterId = req.headers['broadcasteruserlogin'] as string | undefined;
    let cognitoIdToken = req.headers['authorization'] as string | undefined;

    if (!broadcasterId) {
        return res.status(400).json({ error: 'Missing required header: broadcasteruserlogin' });
    }

    if (!cognitoIdToken) {
        return res.status(400).json({ error: 'Missing required header: authorization' });
    }

    if (cognitoIdToken.startsWith('Bearer ')) {
        cognitoIdToken = cognitoIdToken.slice(7);
    }

    try {
        const cognitoUserId = (await verifyToken(cognitoIdToken)).sub;

        if (!cognitoUserId) {
            return res.status(400).json({ error: 'Invalid id_token' });
        }

        const result = await getStreamsByBroadcasterUsernameFromApiGateway(cognitoUserId, broadcasterId);

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
