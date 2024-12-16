import {twitchApiClient} from "../twitchApiConfig";
import {logger} from "../../utilities/logger";

const LOG_PREFIX = 'TWITCH_API_EVENTSUB';

/**
 * Deletes a Twitch EventSub subscription by its ID.
 */
export async function deleteTwitchEventsubSubscription(queryParams: any) {
    try {
        return await twitchApiClient.delete('/eventsub/subscriptions', {
            params: { ...queryParams },
        });

    } catch (error: any) {
        logger.error(`Error unsubscribing from Twitch EventSub: ${error.response?.data || error.message}`, LOG_PREFIX);
        throw error;
    }
}