import {twitchApiClient} from "../twitchApiConfig";
import {logger} from "../../utilities/logger";

const LOG_PREFIX = 'TWITCH_API_MODERATION';

// Requires a user access token that includes the moderator:manage:blocked_terms scope.
// moderator_id The ID of the broadcaster or a user that has permission to moderate the broadcaster’s chat room. This ID must match the user ID in the user access token.
export const deleteBlockedTerm = async (queryParams:any) => {
    try {
        const result = await twitchApiClient.delete('/moderation/blocked_terms', {
            params: queryParams,
        })
        return result.data
    } catch (error: any) {
        logger.error(`Error deleting blocked_term: ${error.message}`, LOG_PREFIX);
        throw error;
    }
};