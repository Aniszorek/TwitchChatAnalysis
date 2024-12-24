import {twitchApiClient} from "../twitchApiConfig";
import {logger} from "../../utilities/logger";
import {AutomodSettingsResponse} from "../../routes/twitch/model/getAutomodSettingsResponse";

const LOG_PREFIX = 'TWITCH_API_MODERATION';

// Requires a user access token that includes the moderator:read:automod_settings scope.
// moderator_id The ID of the broadcaster or a user that has permission to moderate the broadcaster’s chat room. This ID must match the user ID in the user access token.
export const getAutomodSettings = async (queryParams: any, headers:any): Promise<AutomodSettingsResponse> => {
    try {
        const result =  await twitchApiClient.get('/moderation/automod/settings', {
            params: queryParams,
            headers: { ...headers }
        })
        return result.data;

    } catch (error: any) {
        logger.error(`Error fetching automod settings: ${error.message}`, LOG_PREFIX);
        throw error;
    }
};