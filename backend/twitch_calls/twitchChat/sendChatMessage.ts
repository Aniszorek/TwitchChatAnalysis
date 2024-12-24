import {twitchApiClient} from "../twitchApiConfig";
import {logger} from "../../utilities/logger";
import {SendChatMessagePayload} from "../../routes/twitch/model/postSendChatMessagePayload";

const LOG_PREFIX = 'TWITCH_API_CHAT';

// Requires an app access token or user access token that includes the user:write:chat scope.
// If app access token used, then additionally requires user:bot scope from chatting user, and either channel:bot scope from broadcaster or moderator status.
export const postChatMessage = async (payload: SendChatMessagePayload, headers:any) => {
    try {
        const result = await twitchApiClient.post('/chat/messages', payload, {
            headers: {
                ...headers
            }
        })
        return result.data
    } catch (error: any) {
        logger.error(`Error sending chat message: ${error.message}`, LOG_PREFIX);
        throw error;
    }
};