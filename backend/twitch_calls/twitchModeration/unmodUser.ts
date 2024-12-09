import {twitchApiClient} from "../twitchApiConfig";
import {logger} from "../../utilities/logger";

const LOG_PREFIX = 'TWITCH_API_MODERATION';

// Requires a user access token that includes the channel:manage:moderators scope.
export const deleteModerator = async (queryParams:any) => {
    try {
        const result = await twitchApiClient.delete('/moderation/moderators', {
            params: queryParams,
        })
        return result.data
    } catch (error: any) {
        logger.error(`Error adding moderator: ${error.message}`, LOG_PREFIX);
        throw error;
    }
};