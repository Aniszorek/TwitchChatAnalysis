import {twitchApiClient} from "../twitchApiConfig";
import {logger} from "../../utilities/logger";
import {PutAutomodSettingsPayload} from "../../routes/twitch/model/putAutomodSettingsPayload";

const LOG_PREFIX = 'TWITCH_API_MODERATION';

// Requires a user access token that includes the moderator:manage:automod_settings scope.
// moderator_id		The ID of the broadcaster or a user that has permission to moderate the broadcaster’s chat room.
// This ID must match the user ID in the user access token.
export const putAutomodSettings = async (queryParams:any, payload: PutAutomodSettingsPayload, headers:any) => {
    try {
        const result = await twitchApiClient.put('/moderation/automod/settings', payload, {
            params: queryParams,
            headers: { ...headers }
        })
        return result.data
    } catch (error: any) {
        logger.error(`Error patching chat settings`, LOG_PREFIX);
        throw error;
    }
};
