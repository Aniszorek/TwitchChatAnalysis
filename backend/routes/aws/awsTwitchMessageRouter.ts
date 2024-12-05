import express from "express";
import {getChannelFollowersCount} from "../../twitch_calls/twitchChannels/getChannelFollowers";
import {logger} from "../../utilities/logger";
import {getStreamsByBroadcasterUsernameFromApiGateway} from "../../api_gateway_calls/stream/getStreamByBroadcaster";
import {verifyToken} from "../../aws/cognitoAuth";
import {getStreamFromApiGateway, GetStreamMessage} from "../../api_gateway_calls/stream/getStream";
import axios from "axios";
import {
    getTwitchMessageFromApiGateway,
    GetTwitchMessageOptions, GetTwitchMessageResponse
} from "../../api_gateway_calls/twitch-message/getTwitchMessage";

export const awsTwitchMessageRouter = express.Router();

const LOG_PREFIX = 'AWS_API_TWITCH_MESSAGE';

awsTwitchMessageRouter.get('/', async (req, res) => {

    const broadcasterUsername = req.headers['broadcasteruserlogin'] as string | undefined;
    let cognitoIdToken = req.headers['authorization'] as string | undefined;

    const streamId = req.query.stream_id as string | undefined;
    const startTime = req.query.start_time as string | undefined;
    const endTime = req.query.end_time as string | undefined;
    const chatterUserLogin = req.query.chatter_user_login as string | undefined;

    if (!broadcasterUsername) {
        return res.status(400).json({ error: 'Missing required header: broadcasteruserlogin' });
    }

    if (!cognitoIdToken) {
        return res.status(400).json({ error: 'Missing required header: authorization' });
    }

    if (cognitoIdToken.startsWith('Bearer ')) {
        cognitoIdToken = cognitoIdToken.slice(7);
    }

    if (!chatterUserLogin) {
        return res.status(400).json({ error: 'Missing required param: chatter_user_login' });
    }

    try {

        const options: GetTwitchMessageOptions = {};
        if (streamId) {options.stream_id = streamId;}
        if (startTime) {options.start_time = startTime;}
        if (endTime) {options.end_time = endTime;}
        if (chatterUserLogin) {options.chatter_user_login = chatterUserLogin;}

        const result = await getTwitchMessageFromApiGateway(cognitoIdToken, broadcasterUsername, options)

        if(result.status == 200)
        {
            res.status(200).json(Array.isArray(result.data)
                ? (result.data as GetTwitchMessageResponse[])
                : result.data)
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
                `Error in /aws/twitch-message route: ${JSON.stringify(error.message)}, status: ${error.status}`,
                LOG_PREFIX
            );
            res.status(error.status).json(error.message);
        }
        else {
            logger.error(
                `Unexpected error in /aws/twitch-message route: ${error.message || 'Unknown error'}`,
                LOG_PREFIX
            );
            res.status(500).json({ error: `Failed to GET twitch-message data: ${error.message || 'Unknown error'}` });
        }
    }

});
