import {deleteTwitchEventsubSubscription} from "../../../twitch_calls/twitchEventsub/deleteTwitchEventsubSubscription";
import {LogColor, logger} from "../../../utilities/logger";
import {registerResponse} from "../../../twitch_calls/twitchEventsub/postTwitchEventsubSubscription";
import {trackSubscription} from "../../../bot/localWebsocket/wsServer";
import {IS_DEBUG_ENABLED} from "../../../entryPoint";

const LOG_PREFIX = "TWITCH_EVENTSUB_CONTROLLER";

export class TwitchEventsubController {
    // for internal use only
    public async deleteTwitchSubscription(subscriptionId: string, headers:any):Promise<boolean> {
        try {

            const queryParams = {
                id: subscriptionId
            }

            const response = await deleteTwitchEventsubSubscription(queryParams, headers)

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

    // for internal use only
    public async postTwitchSubscription(cognitoUserId: string, websocketSessionID: string, type:string, condition:any, headers:any, version:string = '1' )
    {
        try {
            const payload = {
                type,
                version: version,
                condition,
                transport: {
                    method: 'websocket',
                    session_id: websocketSessionID
                }
            }

            const response = await registerResponse(payload, headers)

                if (response.status === 202) {
                    const subscriptionId = response.data.data[0].id;
                    trackSubscription(cognitoUserId, subscriptionId);
                    logger.info(`Subscribed to ${type} [${response.data.data[0].id}]`, LOG_PREFIX, {color: LogColor.MAGENTA_BRIGHT});
                } else {
                    logger.error(`Failed to subscribe to ${type}. Status code ${response.status}`, LOG_PREFIX);
                    logger.error(IS_DEBUG_ENABLED ?JSON.stringify(response.data, null, 2) : "", LOG_PREFIX);
                }
        } catch (error: any) {
            logger.error(`Error subscribing to Twitch EventSub - ${type}: ${error.response?.data || error.message}`, LOG_PREFIX);
        }
    }

}

export const twitchEventsubController = new TwitchEventsubController();