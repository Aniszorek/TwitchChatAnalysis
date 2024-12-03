import express from "express";
import {getSuspendedUsers} from "../../twitch_calls/twitchUsers/getSuspendedUsers";
import {getChannelSubscriptionsCount} from "../../twitch_calls/twitch/getBroadcastersSubscriptions";

export const twitchRouter = express.Router();

const LOG_PREFIX = 'TWITCH_API:';

twitchRouter.get('/subscriptions', async (req, res) => {
    const broadcasterId = req.query.broadcaster_id as string;

    if (!broadcasterId) {
        return res.status(400).json({error: 'Missing required parameter: broadcaster_id'});
    }

    try {
        const result = await getChannelSubscriptionsCount(broadcasterId)
        res.json(result);
    } catch (error: any) {
        console.error(`${LOG_PREFIX} Error in /subscriptions route:`, error.message);
        res.status(500).json({error: 'Failed to fetch broadcaster\'s subscriptions'});
    }
});
