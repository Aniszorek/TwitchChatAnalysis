import {twitchApiClient} from "../twitchApiConfig";
import {logger} from "../../utilities/logger";

const LOG_PREFIX = 'TWITCH_API_EVENTSUB';


export async function registerResponse(payload:any, headers:any) {
    try {
        return await twitchApiClient.post('/eventsub/subscriptions', payload, {
            headers: { ...headers }
        });
    }
    catch (error: any) {
        logger.error(`Error subscribing from Twitch EventSub: ${error.response?.data || error.message}`, LOG_PREFIX);
        throw error;
    }

}