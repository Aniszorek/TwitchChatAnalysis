import express from "express";
import {getChannelFollowersCount} from "../../twitch_calls/twitchChannels/getChannelFollowers";
import {LogColor, logger, LogStyle} from "../../utilities/logger";
import {getChannelVips} from "../../twitch_calls/twitchChannels/getChannelVips";
import {extractQueryParams} from "../../utilities/utilities";
import {postAddVip} from "../../twitch_calls/twitchChannels/vipUser";
import {deleteVipUser} from "../../twitch_calls/twitchChannels/unvipUser";
import {patchChatSettings} from "../../twitch_calls/twitchChat/patchChatSettings";
import {
    isPatchChannelInformationPayload,
    patchChannelInformation
} from "../../twitch_calls/twitchChannels/patchChannelInformation";

export const twitchChannelsRouter = express.Router();

const LOG_PREFIX = 'TWITCH_API_CHANNELS';

twitchChannelsRouter.get('/followers', async (req, res) => {
    try {
        const queryParams = extractQueryParams(req, ["broadcaster_id"]);
        const result = await getChannelFollowersCount(queryParams);
        logger.info(`Successfully get followers count`, LOG_PREFIX, {color: LogColor.MAGENTA, style: LogStyle.DIM});
        res.json(result);
    } catch (error: any) {
        logger.error(`Error in /followers route: ${error.message}`, LOG_PREFIX);
        res.status(500).json({error: 'Failed to fetch channel followers users'});
    }
});

twitchChannelsRouter.get('/vips', async (req, res) => {
    try {
        const queryParams = extractQueryParams(req, ["broadcaster_id"]);
        const result = await getChannelVips(queryParams);
        logger.info(`Successfully get vips for broadcaster_id: ${queryParams.broadcaster_id}`, LOG_PREFIX, {color: LogColor.MAGENTA, style: LogStyle.DIM});

        res.json(result);
    } catch (error: any) {
        logger.error(`Error in /vips route: ${error.message}`, LOG_PREFIX);
        res.status(500).json({error: 'Failed to fetch channel vip users'});
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

twitchChannelsRouter.patch('/', async (req, res) => {
    try{
        const queryParams = extractQueryParams(req, ["broadcaster_id"]);
        const payload = req.body
        isPatchChannelInformationPayload(payload)
        const result= await patchChannelInformation(queryParams, payload)
        logger.info(`Successfully patched stream settings`, LOG_PREFIX, {color: LogColor.MAGENTA, style: LogStyle.DIM});
        res.json(result);
    }
    catch(error: any) {
        logger.error(`Error in patch / route: ${error.message}`, LOG_PREFIX);
        res.status(500).json({error: `Failed to patch stream settings`});
    }
})

