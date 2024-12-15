import {TCASecured} from "../../../utilities/TCASecuredDecorator";
import {COGNITO_ROLES, verifyUserPermission} from "../../../cognitoRoles";
import express from "express";
import {LogColor, logger, LogStyle} from "../../../utilities/logger";
import {IS_DEBUG_ENABLED} from "../../../entryPoint";
import {fetchTwitchUserId} from "../../../twitch_calls/twitchAuth";
import {getTwitchMessageFromApiGateway,} from "../../../api_gateway_calls/twitch-message/getTwitchMessage";
import {getSuspendedUsers} from "../../../twitch_calls/twitchUsers/getSuspendedUsers";
import {getChannelVips} from "../../../twitch_calls/twitchChannels/getChannelVips";
import {getChannelModerators} from "../../../twitch_calls/twitchModeration/getModerators";
import {GetTwitchMessageResponse, TwitchMessageData} from "../model/getTwitchMessageResponse";
import {ErrorWithStatus} from "../../../utilities/ErrorWithStatus";

const LOG_PREFIX = "AWS_TWITCH_MESSAGE_CONTROLLER"

class AwsTwitchMessageController {

    @TCASecured({
        requiredQueryParams: ["chatter_user_login"],
        optionalQueryParams: ["stream_id", "start_time", "end_time"],
        requiredHeaders: ["authorization", "broadcasteruserlogin"],
        requiredRole: COGNITO_ROLES.MODERATOR,
        actionDescription: "Get TwitchMessages"
    })
    public async getTwitchMessages(req: express.Request, res: express.Response, next: express.NextFunction, context: any) {
        const {queryParams, optionalQueryParams, headers, validatedBody, cognitoUserId} = context;
        try{

            const broadcasterId = await AwsTwitchMessageController.getBroadcasterId(headers.broadcasteruserlogin);
            const result = await getTwitchMessageFromApiGateway({...queryParams, ...optionalQueryParams}, headers);

            const response = await AwsTwitchMessageController.buildResponse(
                result,
                broadcasterId,
                cognitoUserId,
                queryParams.chatter_user_login
            );

            logger.info("Successfully get twitch messages", LOG_PREFIX, { color: LogColor.YELLOW, style: LogStyle.DIM });
            res.status(200).json(response);
        }
        catch (error: any) {

            if(error instanceof ErrorWithStatus)
            {
                logger.error(`Error in get /twitch-messages: ${error}. ${IS_DEBUG_ENABLED ? JSON.stringify(error.message, null, 2) : ""}`, LOG_PREFIX);
                res.status(error.status).json({
                    error: `Failed to fetch twitch messages: ${JSON.stringify(error.message)}`,
                });
            }
            else {
                logger.error(`Error in get /twitch-messages: ${error}. ${IS_DEBUG_ENABLED ? JSON.stringify(error.response, null, 2) : ""}`, LOG_PREFIX);
                res.status(error.response.status).json({
                    error: `Failed to fetch twitch messages: ${JSON.stringify(error.response.data)}`,
                });
            }


        }

    }

    private static async buildResponse(
        messages: TwitchMessageData[],
        broadcasterId: string,
        cognitoUserId: string,
        chatterUserLogin: string
    ): Promise<GetTwitchMessageResponse> {
        const response: GetTwitchMessageResponse = { chatter_user_login: chatterUserLogin, messages };

        if (verifyUserPermission(cognitoUserId, COGNITO_ROLES.STREAMER, 'get chatter data only for streamer access')) {
            const suspendedLists = await getSuspendedUsers({broadcaster_id: broadcasterId});
            response.is_banned = suspendedLists.banned_users.some(user => user.user_login === chatterUserLogin);
            response.is_timeouted = suspendedLists.timed_out_users.some(user => user.user_login === chatterUserLogin);

            const vipList = await getChannelVips({broadcaster_id: broadcasterId});
            response.is_vip = vipList?.some(user => user.user_login === chatterUserLogin);

            const modList = await getChannelModerators({broadcaster_id: broadcasterId});
            response.is_mod = modList?.some(user => user.user_login === chatterUserLogin);
        }

        return response;
    }

    private static async getBroadcasterId (broadcasterUsername: string){

        const response = await fetchTwitchUserId(broadcasterUsername);
        if (!response.userId) {

            throw new ErrorWithStatus(400, `Broadcaster with username: ${broadcasterUsername} does not exist`);
        }
        return response.userId;
    }

}

export const awsTwitchMessageController = new AwsTwitchMessageController();