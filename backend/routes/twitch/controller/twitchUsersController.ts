import {NextFunction, Request, Response} from "express";
import {TCASecured} from "../../../utilities/TCASecuredDecorator";
import {getSuspendedUsers} from "../../../twitch_calls/twitchUsers/getSuspendedUsers";
import {LogColor, logger, LogStyle} from "../../../utilities/logger";
import {COGNITO_ROLES} from "../../../utilities/CognitoRoleEnum";
import {FetchTwitchUserIdResponse} from "../model/fetchTwitchUserIdResponse";
import {fetchTwitchUserIdByNickname} from "../../../twitch_calls/twitchUsers/fetchUserIdByNickname";
import {fetchTwitchUserIdFromOauthToken} from "../../../twitch_calls/twitchUsers/fetchTwitchUserIdFromOauthToken";
import {getChannelVips} from "../../../twitch_calls/twitchChannels/getChannelVips";
import {getChannelModerators} from "../../../twitch_calls/twitchModeration/getModerators";
import {GetChatterInfoResponse} from "../model/getChatterInfoResponse";

const LOG_PREFIX = "TWITCH_USERS_CONTROLLER";

export class TwitchUsersController {

    @TCASecured({
        requiredQueryParams: ["broadcaster_id"],
        requiredHeaders: ["x-twitch-oauth-token"],
        requiredRole: COGNITO_ROLES.STREAMER,
        actionDescription: "Get Suspended Users"
    })
    public async getSuspended(req: Request, res: Response, next: NextFunction, context: any) {
        const {queryParams, headers, validatedBody} = context;
        try {
            const result = await getSuspendedUsers(queryParams, headers);
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

    @TCASecured({
        requiredQueryParams: ["broadcaster_id", "twitch_username"],
        requiredHeaders: ["x-twitch-oauth-token"],
        requiredRole: COGNITO_ROLES.STREAMER,
        actionDescription: "Get Chatter info"
    })
    public async getChatterInfo(req: Request, res: Response, next: NextFunction, context: any) {
        const {queryParams, headers, validatedBody} = context;
        const twitch_username = queryParams.twitch_username;
        const broadcasterId = queryParams.broadcaster_id;
        const twitchOauthToken = headers["x-twitch-oauth-token"];
        try {

            const resultUserId = await twitchUsersController.fetchTwitchUserIdByNickname(twitch_username, twitchOauthToken);
            if (!resultUserId.found)
            {
                throw Error("Twitch user not found");
            }

            const suspendedLists = await getSuspendedUsers({broadcaster_id: broadcasterId}, headers);
            const resultIsBanned = suspendedLists.banned_users.some(user => user.user_login === twitch_username);
            const resultIsTimeouted = suspendedLists.timed_out_users.some(user => user.user_login === twitch_username);

            const vipList = await getChannelVips({broadcaster_id: broadcasterId}, headers);
            const resultIsVip = vipList?.some(user => user.user_login === twitch_username);

            const modList = await getChannelModerators({broadcaster_id: broadcasterId}, headers);
            const resultIsMod = modList?.some(user => user.user_login === twitch_username);

            const response:GetChatterInfoResponse = {
                chatter_user_login: twitch_username,
                chatter_user_id: resultUserId.userId!,
                is_banned: resultIsBanned,
                is_timeouted: resultIsTimeouted,
                is_vip: resultIsVip,
                is_mod: resultIsMod
            }
            res.json(response);

        } catch (error: any) {
            logger.error(`Error in /chatterInfo route: ${error.message}. ${error.response?.data.message}`, LOG_PREFIX);
            res.status(error.response?.status || 500).json({
                error: `Failed to fetch chatter info users: ${error.response?.data.message || error.message}`
            })
        }

    }


    // for internal use only
    public async fetchTwitchUserIdByNickname(nickname: string, twitchOauthToken: string):Promise<FetchTwitchUserIdResponse> {
        try {

            const queryParams = {
                login: nickname
            }
            const headers = {
                Authorization: `Bearer ${twitchOauthToken}`
            }
            const response = await fetchTwitchUserIdByNickname(queryParams, headers)
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

    // for internal use only
    public async fetchTwitchUserIdFromOauthToken(twitchOauthToken: string) {
        try {
            const headers = {
                Authorization: `Bearer ${twitchOauthToken}`
            }
            const response = await fetchTwitchUserIdFromOauthToken(headers)

            const user = response.data.data[0];
            if (!user) {
                throw new Error('No user data found in the response');
            }
            return user['id'];

        } catch (error: any) {
            logger.error(`Error fetching username for OAuth token: ${error.message}`, LOG_PREFIX);
            throw error
        }
    }

}

export const twitchUsersController = new TwitchUsersController();