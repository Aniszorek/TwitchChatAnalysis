import {twitchApiClient} from "../twitchApiConfig";
import {logger} from "../../utilities/logger";

const LOG_PREFIX = 'TWITCH_API_CHANNELS';

// Requires a user access token that includes the channel:manage:raids scope.
// from_broadcaster_id 	The ID of the broadcaster that’s sending the raiding party. This ID must match the user ID in the user access token.
export const postStartRaid = async (queryParams:any, headers:any) => {
    try {
        const result = await twitchApiClient.post('/raids', {},{
            params: {...queryParams},
            headers: { ...headers }
        })
        return result.data
    } catch (error: any) {
        logger.error(`Error starting a raid: ${error.message}`, LOG_PREFIX);
        throw error;
    }
};