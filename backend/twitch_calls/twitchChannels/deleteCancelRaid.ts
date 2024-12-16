import {twitchApiClient} from "../twitchApiConfig";
import {logger} from "../../utilities/logger";

const LOG_PREFIX = 'TWITCH_API_CHANNELS';


// Requires a user access token that includes the channel:manage:raids scope.
// broadcaster_id 		The ID of the broadcaster that initiated the raid. This ID must match the user ID in the user access token.
export const deleteCancelRaid = async (queryParams: any, headers: any) => {
    try {
        const result = await twitchApiClient.delete('/raids', {
            params: {...queryParams},
            headers: {...headers}
        })
        return result.data
    } catch (error: any) {
        logger.error(`Error cancelling a raid: ${error.message}`, LOG_PREFIX);
        throw error;
    }
};