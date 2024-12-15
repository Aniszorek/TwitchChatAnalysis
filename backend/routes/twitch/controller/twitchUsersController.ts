import {NextFunction, Request, Response} from "express";
import {TCASecured} from "../../../utilities/TCASecuredDecorator";
import {getSuspendedUsers} from "../../../twitch_calls/twitchUsers/getSuspendedUsers";
import {LogColor, logger, LogStyle} from "../../../utilities/logger";
import {COGNITO_ROLES} from "../../../utilities/CognitoRoleEnum";

const LOG_PREFIX = "TWITCH_USERS_CONTROLLER";

export class TwitchUsersController {

    @TCASecured({
        requiredQueryParams: ["broadcaster_id"],
        requiredRole: COGNITO_ROLES.STREAMER,
        actionDescription: "Get Suspended Users"
    })
    public async getSuspended(req: Request, res: Response, next: NextFunction, context: any) {
        const {queryParams, headers, validatedBody} = context;
        try {
            const result = await getSuspendedUsers(queryParams);
            logger.info(
                `Successfully retrieved suspended users for broadcaster_id: ${queryParams.broadcaster_id}`,
                LOG_PREFIX,
                { color: LogColor.MAGENTA, style: LogStyle.DIM }
            );
            res.json(result);
        } catch (error: any) {
            logger.error(`Error in /suspended route: ${error.message}. ${error.response.data.message}`, LOG_PREFIX);
            res.status(error.response.status).json({
                error: `Failed to fetch suspended users: ${error.response.data.message || error.message}`
            })
        }
    }
}

export const twitchUsersController = new TwitchUsersController();