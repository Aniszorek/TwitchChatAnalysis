import express from "express";
import {getChannelFollowersCount} from "../../twitch_calls/twitchChannels/getChannelFollowers";
import {logger} from "../../utilities/logger";

export const twitchChannelsRouter = express.Router();

const LOG_PREFIX = 'TWITCH_API_CHANNEL_FOLLOWERS';

twitchChannelsRouter.get('/followers', async (req, res) => {
    const broadcasterId = req.query.broadcaster_id as string;

    if (!broadcasterId) {
        return res.status(400).json({error: 'Missing required parameter: broadcaster_id'});
    }

    try {
        const result = await getChannelFollowersCount(broadcasterId);
        res.json(result);
    } catch (error: any) {
        logger.error(`Error in /followers route: ${error.message}`, LOG_PREFIX);
        res.status(500).json({error: 'Failed to fetch channel followers users'});
    }
});
