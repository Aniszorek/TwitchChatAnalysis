import {twitchApiClient} from "../twitchApiConfig";
import {logger} from "../../utilities/logger";

const LOG_PREFIX = 'TWITCH_API_EVENTSUB';

/**
 * Deletes a Twitch EventSub subscription by its ID.
 */
export async function deleteTwitchEventsubSubscription(queryParams: any, headers:any) {
    try {
        return await twitchApiClient.delete('/eventsub/subscriptions', {
            params: { ...queryParams },
            headers: { ...headers }
        });

    } catch (error: any) {
        logger.error(`Error unsubscribing from Twitch EventSub: ${error.response?.data || error.message}`, LOG_PREFIX);
        throw error;
    }
}