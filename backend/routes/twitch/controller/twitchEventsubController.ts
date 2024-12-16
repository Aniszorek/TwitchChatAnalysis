import {deleteTwitchEventsubSubscription} from "../../../twitch_calls/twitchEventsub/deleteTwitchEventsubSubscription";
import {LogColor, logger} from "../../../utilities/logger";

const LOG_PREFIX = "TWITCH_EVENTSUB_CONTROLLER";

export class TwitchEventsubController {
    // for internal use only
    public async deleteTwitchSubscription(subscriptionId: string):Promise<boolean> {
        try {

            const queryParams = {
                id: subscriptionId
            }

            const response = await deleteTwitchEventsubSubscription(queryParams)

            if (response.status === 204) {
                logger.info(`Successfully unsubscribed from Twitch EventSub: ${subscriptionId}`, LOG_PREFIX, {color: LogColor.MAGENTA_BRIGHT});
                return true;
            } else {
                logger.error(`Unexpected response while unsubscribing: ${response.status}`, LOG_PREFIX);
                return false;
            }
        } catch (error: any) {
            logger.error(`Error unsubscribing from Twitch EventSub: ${error.response?.data || error.message}`, LOG_PREFIX);
            return false
        }
    }
}

export const twitchEventsubController = new TwitchEventsubController();