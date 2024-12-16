import {twitchApiClient} from "../twitchApiConfig";
import {logger} from "../../utilities/logger";
import {IS_DEBUG_ENABLED} from "../../entryPoint";

const LOG_PREFIX = 'TWITCH_API_USERS';


/**
 * Fetches the Twitch User ID using an OAuth token.
 */
export async function fetchTwitchUserIdFromOauthToken(headers: any) {
    try {
        return await twitchApiClient.get('/users', { headers: { ...headers }});

    } catch (error: any) {
        logger.error(`Error fetching username for OAuth token: ${IS_DEBUG_ENABLED ? JSON.stringify(error.message, null, 2) : ""}`, LOG_PREFIX);
        throw error;
    }
}
