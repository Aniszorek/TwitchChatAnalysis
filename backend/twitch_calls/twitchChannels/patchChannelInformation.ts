import {twitchApiClient} from "../twitchApiConfig";
import {logger} from "../../utilities/logger";
import {PatchChannelInformationPayload} from "../../routes/twitch/model/patchChannelInformationPayload";

const LOG_PREFIX = 'TWITCH_API_CHANNELS';

// Requires a user access token that includes the channel:manage:broadcast scope.
// broadcaster_id The ID of the broadcaster whose channel you want to update. This ID must match the user ID in the user access token.
export const patchChannelInformation = async (queryParams:any, payload: PatchChannelInformationPayload, headers:any) => {
    try {
        const result = await twitchApiClient.patch('/channels', payload, {
            params: queryParams,
            headers: { ...headers }
        })
        return result.data
    } catch (error: any) {
        logger.error(`Error patching channel information: ${error.message}`, LOG_PREFIX);
        throw error;
    }
};



