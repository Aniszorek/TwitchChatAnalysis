import {twitchApiClient} from "../twitchApiConfig";
import {logger} from "../../utilities/logger";

const LOG_PREFIX = 'TWITCH_API_CHANNELS';

// Requires a user access token that includes the channel:manage:vips scope.
// broadcaster_id  The ID of the broadcaster that’s adding the user as a VIP. This ID must match the user ID in the access token.
export const deleteVipUser = async (queryParams:any, headers:any) => {
    try {
        const result = await twitchApiClient.delete('/channels/vips', {
            params: queryParams,
            headers: { ...headers }
        })
        return result.data
    } catch (error: any) {
        logger.error(`Error adding VIP: ${error.message}`, LOG_PREFIX);
        throw error;
    }
};