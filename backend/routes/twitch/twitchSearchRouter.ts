import express from "express";
import {LogColor, logger, LogStyle} from "../../utilities/logger";
import {extractQueryParams} from "../../utilities/utilities";
import {getSearchCategories} from "../../twitch_calls/twitchSearch/searchTwitchCategories";

export const twitchSearchRouter = express.Router();

const LOG_PREFIX = 'TWITCH_API_SEARCH';

twitchSearchRouter.get('/categories', async (req, res) => {
    try {
        const queryParams = extractQueryParams(req, ["query"])
        const result = await getSearchCategories(queryParams);
        logger.info(`Successfully searched categories`, LOG_PREFIX, {color: LogColor.MAGENTA, style: LogStyle.DIM});
        res.json(result);
    } catch (error: any) {
        logger.error(`Error in get /categories route: ${error.message}`, LOG_PREFIX);
        res.status(error.response.status).json({error: `Failed to search categories: ${error.response.data.message}`});
    }
});
