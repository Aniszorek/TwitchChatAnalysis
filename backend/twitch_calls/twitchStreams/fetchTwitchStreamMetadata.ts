import {twitchApiClient} from "../twitchApiConfig";
import {logger} from "../../utilities/logger";

const LOG_PREFIX = 'TWITCH_API_STREAMS';

/**
 * Fetches Twitch stream data for a specific user ID
 */
export async function fetchTwitchStreamMetadata(queryParams:any, headers:any) {
    try {
        return await twitchApiClient.get('/streams', {
            params: { ...queryParams},
            headers: { ...headers },
        });

    } catch (error: any) {
        logger.error(`Error fetching Twitch stream data: ${error.message}`, LOG_PREFIX);
        throw error;
    }
}