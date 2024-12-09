import express from "express";
import {getChannelFollowersCount} from "../../twitch_calls/twitchChannels/getChannelFollowers";
import {LogColor, logger, LogStyle} from "../../utilities/logger";
import {getChannelVips} from "../../twitch_calls/twitchChannels/getChannelVips";
import {extractQueryParams} from "../../utilities/utilities";
import {postAddVip} from "../../twitch_calls/twitchChannels/vipUser";
import {deleteVipUser} from "../../twitch_calls/twitchChannels/unvipUser";

export const twitchChannelsRouter = express.Router();

const LOG_PREFIX = 'TWITCH_API_CHANNELS';

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

twitchChannelsRouter.get('/vips', async (req, res) => {
    const broadcasterId = req.query.broadcaster_id as string;

    if (!broadcasterId) {
        return res.status(400).json({error: 'Missing required parameter: broadcaster_id'});
    }

    try {
        const result = await getChannelVips(broadcasterId);
        res.json(result);
    } catch (error: any) {
        logger.error(`Error in /followers route: ${error.message}`, LOG_PREFIX);
        res.status(500).json({error: 'Failed to fetch channel followers users'});
    }
});

twitchChannelsRouter.post('/vips', async (req, res) => {
    try{
        const queryParams = extractQueryParams(req, ["broadcaster_id", "user_id"]);
        const result= await postAddVip(queryParams)
        logger.info(`Successfully added VIP with user_id: ${queryParams.user_id}`, LOG_PREFIX, {color: LogColor.MAGENTA, style: LogStyle.DIM});
        res.json(result);
    }
    catch(error: any) {
        logger.error(`Error in post /vips route: ${error.message}`, LOG_PREFIX);
        res.status(500).json({error: `Failed to add VIP`});
    }
})

twitchChannelsRouter.delete('/vips', async (req, res) => {
    try{
        const queryParams = extractQueryParams(req, ["broadcaster_id", "user_id"]);
        const result= await deleteVipUser(queryParams)
        logger.info(`Successfully deleted VIP with user_id: ${queryParams.user_id}`, LOG_PREFIX, {color: LogColor.MAGENTA, style: LogStyle.DIM});
        res.json(result);
    }
    catch(error: any) {
        logger.error(`Error in delete /vips route: ${error.message}`, LOG_PREFIX);
        res.status(500).json({error: `Failed to delete VIP`});
    }
})

