import {twitchApiClient} from "../twitchApiConfig";
import {logger} from "../../utilities/logger";

const LOG_PREFIX = 'TWITCH_API_USERS';

/**
 * Fetches the Twitch User ID based on the user's nickname
 */
export async function fetchTwitchUserIdByNickname(queryParams: any, headers: any) {
    try {
        return await twitchApiClient.get('/users', {
            params: { ...queryParams },
            headers: { ...headers },
        });

    } catch (error: any) {
        logger.error(`Error while fetching Twitch user ID ${error.message}`, LOG_PREFIX);
        throw error;
    }
}