import { Request, Response, NextFunction } from "express";
import { LogColor, logger, LogStyle } from "../../../utilities/logger";
import { getSearchCategories } from "../../../twitch_calls/twitchSearch/searchTwitchCategories";
import {TCASecured} from "../../../utilities/TCASecuredDecorator";
import {COGNITO_ROLES} from "../../../cognitoRoles";

const LOG_PREFIX = "TWITCH_SEARCH_CONTROLLER";

export class TwitchSearchController {
    @TCASecured({
        requiredQueryParams:  ["query"],
        requiredRole: COGNITO_ROLES.VIEWER,
        actionDescription: "Search Categories"
    })
    public async searchCategories(req: Request, res: Response, next: NextFunction, context: any) {
        const {queryParams, headers, validatedBody} = context;
        try {
            const result = await getSearchCategories(queryParams);
            logger.info(`Successfully searched categories`, LOG_PREFIX, { color: LogColor.MAGENTA, style: LogStyle.DIM });
            res.json(result);
        } catch (error: any) {
            logger.error(`Error in get /categories route: ${error.message}. ${error.response.data.message}`, LOG_PREFIX);
            res.status(error.response.status).json({ error: `Failed to search categories: ${error.response.data.message}` });
        }
    }
}

export const twitchSearchController = new TwitchSearchController()