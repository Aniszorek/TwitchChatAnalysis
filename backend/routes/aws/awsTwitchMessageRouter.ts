import express from "express";
import {logger} from "../../utilities/logger";
import {
    getTwitchMessageFromApiGateway,
    GetTwitchMessageOptions,
    TwitchMessageData,
} from "../../api_gateway_calls/twitch-message/getTwitchMessage";
import {getSuspendedUsers} from "../../twitch_calls/twitchUsers/getSuspendedUsers";
import {fetchTwitchUserId} from "../../twitch_calls/twitchAuth";
import {encodeTimestamp} from "../../utilities/utilities";
import {getChannelVips, VipUser} from "../../twitch_calls/twitchChannels/getChannelVips";
import {verifyToken} from "../../aws/cognitoAuth";
import {COGNITO_ROLES, verifyUserPermission} from "../../cognitoRoles";
import {getChannelModerators} from "../../twitch_calls/twitchModeration/getModerators";

export const awsTwitchMessageRouter = express.Router();

const LOG_PREFIX = 'AWS_API_TWITCH_MESSAGE';

interface GetTwitchMessageResponse {
    chatter_user_login: string;
    is_banned?: boolean;
    is_timeouted?: boolean;
    is_vip?: boolean;
    is_mod?: boolean;
    messages: TwitchMessageData[];
}

awsTwitchMessageRouter.get('/', async (req, res) => {

    const broadcasterUsername = req.headers['broadcasteruserlogin'] as string | undefined;
    let cognitoIdToken = req.headers['authorization'] as string | undefined;

    const streamId = req.query.stream_id as string | undefined;
    const startTime = req.query.start_time as string | undefined;
    const endTime = req.query.end_time as string | undefined;
    const chatterUserLogin = req.query.chatter_user_login as string | undefined;

    if (!broadcasterUsername) {
        return res.status(400).json({ error: 'Missing required header: broadcasteruserlogin' });
    }

    if (!cognitoIdToken) {
        return res.status(400).json({ error: 'Missing required header: authorization' });
    }

    if (cognitoIdToken.startsWith('Bearer ')) {
        cognitoIdToken = cognitoIdToken.slice(7);
    }

    if (!chatterUserLogin) {
        return res.status(400).json({ error: 'Missing required param: chatter_user_login' });
    }

    const cognitoUserId = (await verifyToken(cognitoIdToken)).sub
    if(!cognitoUserId)
    {
        return res.status(400).json({ error: 'Invalid cognitoIdToken' });
    }


    try {

        const options: GetTwitchMessageOptions = {};
        if (streamId) {options.stream_id = streamId}
        if (startTime) {options.start_time = encodeTimestamp(startTime)}
        if (endTime) {options.end_time = encodeTimestamp(endTime)}
        if (chatterUserLogin) {options.chatter_user_login = chatterUserLogin}

        if(startTime)
        logger.debug(encodeTimestamp(startTime),LOG_PREFIX)

        const result = await getTwitchMessageFromApiGateway(cognitoIdToken, broadcasterUsername, options)

        if(result.status == 200)
        {
            const twitchUserIdResponse = await fetchTwitchUserId(broadcasterUsername)
            const broadcasterId = twitchUserIdResponse.userId
            if(!broadcasterId) {
                return res.status(400).json({ error: `Broadcaster with username: ${broadcasterUsername} does not exist` });
            }


            if(cognitoUserId && verifyUserPermission(cognitoUserId, COGNITO_ROLES.STREAMER, 'get chatter data only for streamer access'))
            {
                const suspendedLists = await getSuspendedUsers(broadcasterId)
                const isBanned = suspendedLists.banned_users.some(user => user.user_login === chatterUserLogin)
                const isTimeouted = suspendedLists.timed_out_users.some(user => user.user_login === chatterUserLogin)

                const vipList = await getChannelVips(broadcasterId)
                const isVip = vipList ? vipList.some(user => user.user_login === chatterUserLogin) : undefined

                const modList = await getChannelModerators(broadcasterId)
                const isMod = modList ? modList.some(user => user.user_login === chatterUserLogin) : undefined


                const response: GetTwitchMessageResponse = {
                    chatter_user_login: chatterUserLogin,
                    is_banned: isBanned,
                    is_timeouted: isTimeouted,
                    is_vip: isVip,
                    is_mod: isMod,
                    messages: result.data as TwitchMessageData[]
                }
                res.status(200).json(response)

            } else {
                // you are not a streamer :(
                const response: GetTwitchMessageResponse = {
                    chatter_user_login: chatterUserLogin,
                    messages: result.data as TwitchMessageData[]
                }
                res.status(200).json(response)
            }
        }
        else
        {
            res.status(result.status).json({
                data: result.data || null,
            })
        }

    } catch (error: any) {
        if(error.status && error.message) {
            logger.error(
                `Error in /aws/twitch-message route: ${JSON.stringify(error.message)}, status: ${error.status}`,
                LOG_PREFIX
            );
            res.status(error.status).json(error.message);
        }
        else {
            logger.error(
                `Unexpected error in /aws/twitch-message route: ${error.message || 'Unknown error'}`,
                LOG_PREFIX
            );
            res.status(500).json({ error: `Failed to GET twitch-message data: ${error.message || 'Unknown error'}` });
        }
    }

});
