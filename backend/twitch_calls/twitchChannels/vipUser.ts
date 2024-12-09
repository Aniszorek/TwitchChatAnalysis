import {twitchApiClient} from "../twitchApiConfig";
import {logger} from "../../utilities/logger";

const LOG_PREFIX = 'TWITCH_API_CHANNELS';

// Requires a user access token that includes the channel:manage:vips scope.
// broadcaster_id The ID of the broadcaster who owns the channel where the user has VIP status.
export const postAddVip = async (queryParams:any) => {
    try {
        const result = await twitchApiClient.post('/channels/vips', {}, {
            params: queryParams,
        })
        return result.data
    } catch (error: any) {
        logger.error(`Error adding VIP: ${error.message}`, LOG_PREFIX);
        throw error;
    }
};