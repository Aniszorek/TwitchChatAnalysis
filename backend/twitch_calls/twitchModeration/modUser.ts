import {twitchApiClient} from "../twitchApiConfig";
import {logger} from "../../utilities/logger";

const LOG_PREFIX = 'TWITCH_API_MODERATION';

// Requires a user access token that includes the channel:manage:moderators scope.
// broadcaster_id  The ID of the broadcaster that owns the chat room. This ID must match the user ID in the access token.
export const postAddModerator = async (queryParams:any) => {
    try {
        const result = await twitchApiClient.post('/moderation/moderators', {}, {params: queryParams});
        return result.data
    } catch (error: any) {
        logger.error(`Error adding moderator: ${error.message}`, LOG_PREFIX);
        throw error;
    }
};