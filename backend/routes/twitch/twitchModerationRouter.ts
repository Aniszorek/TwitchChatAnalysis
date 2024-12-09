import express from "express";
import {LogColor, logger, LogStyle} from "../../utilities/logger";
import {getChannelModerators} from "../../twitch_calls/twitchModeration/getModerators";
import {BanUserPayload, isBanUserPayload, postBanUser} from "../../twitch_calls/twitchModeration/banUser";

export const twitchModerationRouter = express.Router();

const LOG_PREFIX = 'TWITCH_API_MODERATION';

twitchModerationRouter.get('/moderators', async (req, res) => {
    const broadcasterId = req.query.broadcaster_id as string;

    if (!broadcasterId) {
        return res.status(400).json({error: 'Missing required parameter: broadcaster_id'});
    }

    try {
        const result = await getChannelModerators(broadcasterId)
        res.json(result);
    } catch (error: any) {
        logger.error(`Error in /followers route: ${error.message}`, LOG_PREFIX);
        res.status(500).json({error: 'Failed to fetch channel followers users'});
    }
});

twitchModerationRouter.post('/bans', async (req, res) => {
    try{
        const payload:BanUserPayload = req.body;
        isBanUserPayload(payload)
        const result= await postBanUser(payload)
        logger.info(`Successfully suspended user with id: ${payload.data.user_id}`, LOG_PREFIX, {color: LogColor.MAGENTA, style: LogStyle.DIM});
        res.json(result);
    }
    catch(error: any) {
        logger.error(`Error in /bans route: ${error.message}`, LOG_PREFIX);
        res.status(500).json({error: `Failed to ban user`});
    }
})
