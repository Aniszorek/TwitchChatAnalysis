import {twitchApiClient} from "../twitchApiConfig";
import {logger} from "../../utilities/logger";

const LOG_PREFIX = 'TWITCH_API_MODERATION';

// Requires a user access token that includes the moderator:manage:banned_users scope.
export const deleteBanUser = async (queryParams:any) => {
    try {
        const result = await twitchApiClient.delete('/moderation/bans', {
            params: queryParams,
        })
        return result.data
    } catch (error: any) {
        logger.error(`Error suspending user: ${error.message}`, LOG_PREFIX);
        throw error;
    }
};