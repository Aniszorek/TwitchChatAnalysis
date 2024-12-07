import express from "express";
import { logger } from "../../utilities/logger";
import {
    getTwitchMessageFromApiGateway,
    GetTwitchMessageOptions,
    TwitchMessageData,
} from "../../api_gateway_calls/twitch-message/getTwitchMessage";
import { getSuspendedUsers } from "../../twitch_calls/twitchUsers/getSuspendedUsers";
import { fetchTwitchUserId } from "../../twitch_calls/twitchAuth";
import { getChannelVips } from "../../twitch_calls/twitchChannels/getChannelVips";
import { verifyToken } from "../../aws/cognitoAuth";
import { COGNITO_ROLES, verifyUserPermission } from "../../cognitoRoles";
import { getChannelModerators } from "../../twitch_calls/twitchModeration/getModerators";

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
    try {
        const { broadcasterUsername, cognitoIdToken } = extractHeaders(req);
        const options = extractQueryParams(req);

        const cognitoUserId = await validateCognitoToken(cognitoIdToken);
        const broadcasterId = await getBroadcasterId(broadcasterUsername);

        const result = await fetchTwitchMessages(cognitoIdToken, broadcasterUsername, options);
        const response = await buildResponse(
            result.data as TwitchMessageData[],
            broadcasterId,
            cognitoUserId,
            options.chatter_user_login
        );

        res.status(200).json(response);
    } catch (error) {
        handleError(error, res);
    }
});

/**
 * Extracts headers from the request and performs validation.
 */
function extractHeaders(req: express.Request) {
    const broadcasterUsername = req.headers['broadcasteruserlogin'] as string | undefined;
    let cognitoIdToken = req.headers['authorization'] as string | undefined;

    if (!broadcasterUsername) {
        throw new ErrorWithStatus(400, 'Missing required header: broadcasteruserlogin');
    }

    if (!cognitoIdToken) {
        throw new ErrorWithStatus(400, 'Missing required header: authorization');
    }

    if (cognitoIdToken.startsWith('Bearer ')) {
        cognitoIdToken = cognitoIdToken.slice(7);
    }

    return { broadcasterUsername, cognitoIdToken };
}

/**
 * Extracts query parameters from the request.
 */
function extractQueryParams(req: express.Request) {
    const streamId = req.query.stream_id as string | undefined;
    const startTime = req.query.start_time as string | undefined;
    const endTime = req.query.end_time as string | undefined;
    const chatterUserLogin = req.query.chatter_user_login as string | undefined;

    if (!chatterUserLogin) {
        throw new ErrorWithStatus(400, 'Missing required param: chatter_user_login');
    }

    return { streamId, startTime, endTime, chatter_user_login: chatterUserLogin };
}

/**
 * Validates the Cognito ID token and returns the user ID.
 */
async function validateCognitoToken(token: string) {
    const user = await verifyToken(token);
    if (!user?.sub) {
        throw new ErrorWithStatus(400, 'Invalid cognitoIdToken');
    }
    return user.sub;
}

/**
 * Fetches the broadcaster ID from the username.
 */
async function getBroadcasterId(broadcasterUsername: string) {
    const response = await fetchTwitchUserId(broadcasterUsername);
    if (!response.userId) {
        throw new ErrorWithStatus(400, `Broadcaster with username: ${broadcasterUsername} does not exist`);
    }
    return response.userId;
}

/**
 * Fetches Twitch messages from the API gateway.
 */
async function fetchTwitchMessages(
    cognitoIdToken: string,
    broadcasterUsername: string,
    options: GetTwitchMessageOptions
) {
    const result = await getTwitchMessageFromApiGateway(cognitoIdToken, broadcasterUsername, options);
    if (result.status !== 200) {
        throw new ErrorWithStatus(result.status, result.data || 'Failed to fetch messages');
    }
    return result;
}

/**
 * Builds the response based on user permissions and Twitch data.
 */
async function buildResponse(
    messages: TwitchMessageData[],
    broadcasterId: string,
    cognitoUserId: string,
    chatterUserLogin: string
): Promise<GetTwitchMessageResponse> {
    const response: GetTwitchMessageResponse = { chatter_user_login: chatterUserLogin, messages };

    if (verifyUserPermission(cognitoUserId, COGNITO_ROLES.STREAMER, 'get chatter data only for streamer access')) {
        const suspendedLists = await getSuspendedUsers(broadcasterId);
        response.is_banned = suspendedLists.banned_users.some(user => user.user_login === chatterUserLogin);
        response.is_timeouted = suspendedLists.timed_out_users.some(user => user.user_login === chatterUserLogin);

        const vipList = await getChannelVips(broadcasterId);
        response.is_vip = vipList?.some(user => user.user_login === chatterUserLogin);

        const modList = await getChannelModerators(broadcasterId);
        response.is_mod = modList?.some(user => user.user_login === chatterUserLogin);
    }

    return response;
}

/**
 * Handles errors and sends appropriate HTTP responses.
 */
function handleError(error: any, res: express.Response) {
    const status = error instanceof ErrorWithStatus ? error.status : 500;
    const message = error.message || 'Unknown error';
    logger.error(`Error in /aws/twitch-message route: ${message}`, LOG_PREFIX);
    res.status(status).json({ error: message });
}

/**
 * Custom error class for handling errors with HTTP status codes.
 */
class ErrorWithStatus extends Error {
    status: number;

    constructor(status: number, message: string) {
        super(message);
        this.name = "ErrorWithStatus";
        this.status = status;
    }
}