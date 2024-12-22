import {twitchApiClient} from "../twitchApiConfig";
import {logger} from "../../utilities/logger";
import {BanUserPayload} from "../../routes/twitch/model/postBanUserPayload";

const LOG_PREFIX = 'TWITCH_API_MODERATION';

// Requires a user access token that includes the moderator:manage:banned_users scope.
// broadcaster_id The ID of the broadcaster whose chat room the user is being banned from.
// moderator_id The ID of the broadcaster or a user that has permission to moderate the broadcaster’s chat room. This ID must match the user ID in the user access token.
export const postBanUser = async (payload: BanUserPayload, headers:any) => {
    try {
        const result = await twitchApiClient.post('/moderation/bans', payload, {
            headers: {
                ...headers
            }
        })
        return result.data
    } catch (error: any) {
        logger.error(`Error suspending user: ${error.message}`, LOG_PREFIX);
        throw error;
    }
};