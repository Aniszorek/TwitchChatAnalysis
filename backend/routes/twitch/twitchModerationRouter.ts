import express from "express";
import {LogColor, logger, LogStyle} from "../../utilities/logger";
import {getChannelModerators} from "../../twitch_calls/twitchModeration/getModerators";
import {isBanUserPayload, postBanUser} from "../../twitch_calls/twitchModeration/banUser";
import {extractQueryParams} from "../../utilities/utilities";
import {deleteBanUser} from "../../twitch_calls/twitchModeration/unbanUser";
import {postAddModerator} from "../../twitch_calls/twitchModeration/modUser";
import {deleteModerator} from "../../twitch_calls/twitchModeration/unmodUser";
import {deleteMessage} from "../../twitch_calls/twitchModeration/deleteMessage";
import {getAutomodSettings} from "../../twitch_calls/twitchModeration/getAutomodSettings";
import {isPutAutomodSettingsPayload, putAutomodSettings} from "../../twitch_calls/twitchModeration/putAutomodSettings";
import {getBlockedTerms} from "../../twitch_calls/twitchModeration/getBlockedTerms";
import {isPostBlockedTermPayload, postBlockedTerm} from "../../twitch_calls/twitchModeration/postBlockedTerm";
import {deleteBlockedTerm} from "../../twitch_calls/twitchModeration/deleteBlockedTerm";

export const twitchModerationRouter = express.Router();

const LOG_PREFIX = 'TWITCH_API_MODERATION';

twitchModerationRouter.get('/moderators', async (req, res) => {
    try {
        const queryParams = extractQueryParams(req, ["broadcaster_id"])
        const result = await getChannelModerators(queryParams)
        logger.info(`Successfully get moderators for broadcaster_id: ${queryParams.broadcaster_id}`, LOG_PREFIX, {color: LogColor.MAGENTA, style: LogStyle.DIM});
        res.json(result);
    } catch (error: any) {
        logger.error(`Error in /followers route: ${error.message}`, LOG_PREFIX);
        res.status(error.response.status).json({error: `Failed to fetch channel followers users: ${error.response.data.message}`});
    }
});

twitchModerationRouter.post('/bans', async (req, res) => {
    try{
        const payload = req.body;
        isBanUserPayload(payload)
        const result= await postBanUser(payload)
        logger.info(`Successfully suspended user with id: ${payload.data.user_id}`, LOG_PREFIX, {color: LogColor.MAGENTA, style: LogStyle.DIM});
        res.json(result);
    }
    catch(error: any) {
        logger.error(`Error in post /bans route: ${error.message}`, LOG_PREFIX);
        res.status(error.response.status).json({error: `Failed to ban user: ${error.response.data.message}`});
    }
})

twitchModerationRouter.delete('/bans', async (req, res) => {
    try{
        const queryParams = extractQueryParams(req, ["broadcaster_id", "user_id", "moderator_id"]);
        const result = await deleteBanUser(queryParams)
        logger.info(`Successfully removed suspension of user`, LOG_PREFIX, {color: LogColor.MAGENTA, style: LogStyle.DIM});
        res.json(result);
    }
    catch(error: any) {
        logger.error(`Error in delete /bans route: ${error.message}`, LOG_PREFIX);
        res.status(error.response.status).json({error: `Failed to unban user: ${error.response.data.message}`});
    }
})

twitchModerationRouter.post('/moderators', async (req, res) => {
    try{
        const queryParams = extractQueryParams(req, ["broadcaster_id", "user_id"]);
        const result= await postAddModerator(queryParams)
        logger.info(`Successfully added moderator with user_id: ${queryParams.user_id}`, LOG_PREFIX, {color: LogColor.MAGENTA, style: LogStyle.DIM});
        res.json(result);
    }
    catch(error: any) {
        logger.error(`Error in post /moderator route: ${error.message}`, LOG_PREFIX);
        res.status(error.response.status).json({error: `Failed to add moderator: ${error.response.data.message}`});
    }
})

twitchModerationRouter.delete('/moderators', async (req, res) => {
    try{
        const queryParams = extractQueryParams(req, ["broadcaster_id", "user_id"]);
        const result= await deleteModerator(queryParams)
        logger.info(`Successfully deleted moderator with user_id: ${queryParams.user_id}`, LOG_PREFIX, {color: LogColor.MAGENTA, style: LogStyle.DIM});
        res.json(result);
    }
    catch(error: any) {
        logger.error(`Error in delete /moderator route: ${error.message}`, LOG_PREFIX);
        res.status(error.response.status).json({error: `Failed to delete moderator: ${error.response.data.message}`});
    }
})

twitchModerationRouter.delete('/chat', async (req, res) => {
    try{
        const queryParams = extractQueryParams(req, ["broadcaster_id", "moderator_id", "message_id"]);
        const result= await deleteMessage(queryParams)
        logger.info(`Successfully deleted message with id: ${queryParams.message_id}`, LOG_PREFIX, {color: LogColor.MAGENTA, style: LogStyle.DIM});
        res.json(result);
    }
    catch(error: any) {
        logger.error(`Error in delete /chat route: ${error.message}`, LOG_PREFIX);
        res.status(error.response.status).json({error: `Failed to delete chat message: ${error.response.data.message}`});
    }
})

twitchModerationRouter.get('/automod/settings', async (req, res) => {
    try{
        const queryParams = extractQueryParams(req, ["broadcaster_id", "moderator_id"]);
        const result= await getAutomodSettings(queryParams)
        logger.info(`Successfully get automod settings`, LOG_PREFIX, {color: LogColor.MAGENTA, style: LogStyle.DIM});
        res.json(result);
    }
    catch(error: any) {
        logger.error(`Error in get /automod/settings route: ${error.message}`, LOG_PREFIX);
        res.status(error.response.status).json({error: `Failed to get automod settings: ${error.response.data.message}`});
    }
})

twitchModerationRouter.put('/automod/settings', async (req, res) => {
    try{
        const queryParams = extractQueryParams(req, ["broadcaster_id", "moderator_id"]);
        const payload = req.body
        isPutAutomodSettingsPayload(payload)
        const result= await putAutomodSettings(queryParams, payload)
        logger.info(`Successfully put automod settings: ${queryParams.user_id}`, LOG_PREFIX, {color: LogColor.MAGENTA, style: LogStyle.DIM});
        res.json(result);
    }
    catch(error: any) {
        logger.error(`Error in put /automod/settings route: ${error.message}`, LOG_PREFIX);
        res.status(error.response.status).json({error: `Failed to put automod settings: ${error.response.data.message}`});
    }
})

twitchModerationRouter.get('/blocked_terms', async (req, res) => {
    try{
        const queryParams = extractQueryParams(req, ["broadcaster_id", "moderator_id"]);
        const result= await getBlockedTerms(queryParams)
        logger.info(`Successfully get blocked terms`, LOG_PREFIX, {color: LogColor.MAGENTA, style: LogStyle.DIM});
        res.json(result);
    }
    catch(error: any) {
        logger.error(`Error in get /blocked_terms route: ${error.message}`, LOG_PREFIX);
        res.status(error.response.status).json({error: `Failed to get blocked terms: ${error.response.data.message}`});
    }
})

twitchModerationRouter.post('/blocked_terms', async (req, res) => {
    try{
        const queryParams = extractQueryParams(req, ["broadcaster_id", "moderator_id"]);
        const payload = req.body
        isPostBlockedTermPayload(payload)
        const result= await postBlockedTerm(queryParams, payload)
        logger.info(`Successfully added blocked term`, LOG_PREFIX, {color: LogColor.MAGENTA, style: LogStyle.DIM});
        res.json(result);
    }
    catch(error: any) {
        logger.error(`Error in post /blocked_terms route: ${error.message}`, LOG_PREFIX);
        res.status(error.response.status).json({error: `Failed to add blocked term: ${error.response.data.message}`});
    }
})

twitchModerationRouter.delete('/blocked_terms', async (req, res) => {
    try{
        const queryParams = extractQueryParams(req, ["broadcaster_id", "moderator_id", "id"]);
        const result= await deleteBlockedTerm(queryParams)
        logger.info(`Successfully deleted blocked term`, LOG_PREFIX, {color: LogColor.MAGENTA, style: LogStyle.DIM});
        res.json(result);
    }
    catch(error: any) {
        logger.error(`Error in delete /blocked_terms route: ${error.message}`, LOG_PREFIX);
        res.status(error.response.status).json({error: `Failed to delete blocked term: ${error.response.data.message}`});
    }
})




