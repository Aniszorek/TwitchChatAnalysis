import {NextFunction, Request, Response} from "express";
import {TCASecured} from "../../../utilities/TCASecuredDecorator";
import {getSuspendedUsers} from "../../../twitch_calls/twitchUsers/getSuspendedUsers";
import {LogColor, logger, LogStyle} from "../../../utilities/logger";
import {COGNITO_ROLES} from "../../../utilities/CognitoRoleEnum";
import {FetchTwitchUserIdResponse} from "../model/fetchTwitchUserIdResponse";
import {fetchTwitchUserIdByNickname} from "../../../twitch_calls/twitchUsers/fetchUserIdByNickname";
import {fetchTwitchUserIdFromOauthToken} from "../../../twitch_calls/twitchUsers/fetchTwitchUserIdFromOauthToken";

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

    // for internal use only
    public async fetchTwitchUserIdByNickname(nickname: string):Promise<FetchTwitchUserIdResponse> {
        try {

            const queryParams = {
                login: nickname
            }
            const response = await fetchTwitchUserIdByNickname(queryParams)
            const userId = response.data.data[0]?.id;
            if (!userId) {
                return {found: false, userId: null};
            }

            return  {found: true, userId};

        } catch (error: any) {
            logger.error(`Error while fetching Twitch user ID ${error.message}`, LOG_PREFIX);
            return {found: false, userId: null};
        }
    }

    public async fetchTwitchUserIdFromOauthToken() {
        try {
            const response = await fetchTwitchUserIdFromOauthToken()

            const user = response.data.data[0];
            if (!user) {
                throw new Error('No user data found in the response');
            }
            return user['id'];

        } catch (error: any) {
            console.error(`${LOG_PREFIX} Error fetching username for OAuth token:`, error.message);
            return undefined;
        }
    }

}

export const twitchUsersController = new TwitchUsersController();