import express from "express";
import {getSuspendedUsers} from "../../twitch_calls/twitchUsers/getSuspendedUsers";
import {LogColor, logger, LogStyle} from "../../utilities/logger";
import {extractQueryParams} from "../../utilities/utilities";

export const twitchUsersRouter = express.Router();

const LOG_PREFIX = 'TWITCH_API_USERS';

twitchUsersRouter.get('/suspended', async (req, res) => {
    try {
        const queryParams = extractQueryParams(req, ["broadcaster_id"])
        const result = await getSuspendedUsers(queryParams);
        logger.info(`Successfully get suspended users for broadcaster_id: ${queryParams.broadcaster_id}`, LOG_PREFIX, {color: LogColor.MAGENTA, style: LogStyle.DIM});
        res.json(result);
    } catch (error: any) {
        logger.error(`Error in /banned-users route: ${error.message}`, LOG_PREFIX);
        res.status(500).json({error: 'Failed to fetch banned users'});
    }
});
