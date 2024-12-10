import express from "express";
import {getSuspendedUsers} from "../../twitch_calls/twitchUsers/getSuspendedUsers";
import {LogColor, logger, LogStyle} from "../../utilities/logger";
import {extractQueryParams} from "../../utilities/utilities";
import {isBanUserPayload, postBanUser} from "../../twitch_calls/twitchModeration/banUser";
import {isSendChatMessagePayload, postChatMessage} from "../../twitch_calls/twitchChat/sendChatMessage";
import {IS_DEBUG_ENABLED} from "../../entryPoint";
import {getChatSettings} from "../../twitch_calls/twitchChat/getChatSettings";
import {isPatchChatSettingsPayload, patchChatSettings} from "../../twitch_calls/twitchChat/patchChatSettings";

export const twitchChatRouter = express.Router();

const LOG_PREFIX = 'TWITCH_API_CHAT';

twitchChatRouter.post('/messages', async (req, res) => {
    try{
        const payload = req.body;
        isSendChatMessagePayload(payload)
        const result= await postChatMessage(payload)
        logger.info(`Successfully sent chat messsage: ${IS_DEBUG_ENABLED ? JSON.stringify(result.data, null, 2) : ""}`, LOG_PREFIX, {color: LogColor.MAGENTA, style: LogStyle.DIM});
        res.json(result);
    }
    catch(error: any) {
        logger.error(`Error in post /messages route: ${error.message}`, LOG_PREFIX);
        res.status(500).json({error: `Failed to send chat message`});
    }
});

twitchChatRouter.get('/settings', async (req, res) => {
    try{
        const queryParams = extractQueryParams(req, ["broadcaster_id", "moderator_id"]);
        const result= await getChatSettings(queryParams)
        logger.info(`Successfully fetched chat settings: ${IS_DEBUG_ENABLED ? JSON.stringify(result, null, 2) : ""}`, LOG_PREFIX, {color: LogColor.MAGENTA, style: LogStyle.DIM});
        res.json(result);
    }
    catch(error: any) {
        logger.error(`Error in get /settings route: ${error.message}`, LOG_PREFIX);
        res.status(500).json({error: `Failed to fetch chat settings`});
    }
});

twitchChatRouter.patch('/settings', async (req, res) => {
    try{
        const queryParams = extractQueryParams(req, ["broadcaster_id", "moderator_id"]);
        const payload = req.body
        isPatchChatSettingsPayload(payload)
        const result= await patchChatSettings(queryParams, payload)
        logger.info(`Successfully patched chat settings: ${IS_DEBUG_ENABLED ? JSON.stringify(result, null, 2) : ""}`, LOG_PREFIX, {color: LogColor.MAGENTA, style: LogStyle.DIM});
        res.json(result);
    }
    catch(error: any) {
        logger.error(`Error in patch /settings route: ${error.message}`, LOG_PREFIX);
        res.status(500).json({error: `Failed to patch chat settings`});
    }
});
