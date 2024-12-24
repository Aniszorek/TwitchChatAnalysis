import {twitchApiClient} from "../twitchApiConfig";
import {logger} from "../../utilities/logger";
import {ChatSettingsResponse} from "../../routes/twitch/model/getChatSettingsResponse";

const LOG_PREFIX = 'TWITCH_API_CHAT';

// Requires an app access token or user access token.
// moderator_id The ID of the broadcaster or one of the broadcaster’s moderators.
//   This field is required only if you want to include the non_moderator_chat_delay and non_moderator_chat_delay_duration settings in the response.
//   If you specify this field, this ID must match the user ID in the user access token.
export const getChatSettings = async (queryParams: any, headers: any): Promise<ChatSettingsResponse> => {
    try {
        const result =  await twitchApiClient.get('/chat/settings', {
            params: queryParams,
            headers: { ...headers }
        })
        return result.data;

    } catch (error: any) {
        logger.error(`Error fetching channel chat settings: ${error.message}`, LOG_PREFIX);
        throw error;
    }
};