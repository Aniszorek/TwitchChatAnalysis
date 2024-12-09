import {twitchApiClient} from "../twitchApiConfig";
import {logger} from "../../utilities/logger";

const LOG_PREFIX = 'TWITCH_API_CHANNELS';

// Requires a user access token that includes the channel:manage:vips scope.
export const deleteVipUser = async (queryParams:any) => {
    try {
        const result = await twitchApiClient.delete('/channels/vips', {
            params: queryParams,
        })
        return result.data
    } catch (error: any) {
        logger.error(`Error adding VIP: ${error.message}`, LOG_PREFIX);
        throw error;
    }
};