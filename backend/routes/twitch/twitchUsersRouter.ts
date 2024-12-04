import express from "express";
import {getSuspendedUsers} from "../../twitch_calls/twitchUsers/getSuspendedUsers";

export const twitchUsersRouter = express.Router();

const LOG_PREFIX = 'TWITCH_API_USERS:';

twitchUsersRouter.get('/suspended', async (req, res) => {
    const broadcasterId = req.query.broadcaster_id as string;

    if (!broadcasterId) {
        return res.status(400).json({error: 'Missing required parameter: broadcaster_id'});
    }

    try {
        const result = await getSuspendedUsers(broadcasterId);
        res.json(result);
    } catch (error: any) {
        console.error(`${LOG_PREFIX} Error in /banned-users route:`, error.message);
        res.status(500).json({error: 'Failed to fetch banned users'});
    }
});
