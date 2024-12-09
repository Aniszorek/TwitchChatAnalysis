import {twitchApiClient} from "../twitchApiConfig";
import {logger} from "../../utilities/logger";

const LOG_PREFIX = 'TWITCH_API_MODERATION';

// Requires a user access token that includes the moderator:manage:chat_messages scope.
// broadcaster_id The ID of the broadcaster that owns the chat room to remove messages from.
// moderator_id The ID of the broadcaster or a user that has permission to moderate the broadcaster’s chat room. This ID must match the user ID in the user access token.
export const deleteMessage = async (queryParams:any) => {
    try {
        const result = await twitchApiClient.delete('/moderation/chat', {
            params: queryParams,
        })
        return result.data
    } catch (error: any) {
        logger.error(`Error deleting message: ${error.message}`, LOG_PREFIX);
        throw error;
    }
};