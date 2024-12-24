import {twitchApiClient} from "../twitchApiConfig";
import {logger} from "../../utilities/logger";
import {PatchChatSettingsPayload} from "../../routes/twitch/model/patchChatSettingsPayload";

const LOG_PREFIX = 'TWITCH_API_CHAT';

// Requires a user access token that includes the moderator:manage:chat_settings scope.
// moderator_id	The ID of a user that has permission to moderate the broadcaster’s chat room,
// or the broadcaster’s ID if they’re making the update. This ID must match the user ID in the user access token.
export const patchChatSettings = async (queryParams:any, payload: PatchChatSettingsPayload, headers:any) => {
    try {
        const result = await twitchApiClient.patch('/chat/settings', payload, {
            params: queryParams,
            headers: {
                ...headers
            }
        })
        return result.data
    } catch (error: any) {
        logger.error(`Error patching chat settings: ${error.message}`, LOG_PREFIX);
        throw error;
    }
};
