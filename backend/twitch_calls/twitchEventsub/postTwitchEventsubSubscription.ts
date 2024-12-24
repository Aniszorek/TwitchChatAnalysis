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
        logger.error(`Error subscribing from Twitch EventSub: ${JSON.stringify(error.response?.data, null, 2) || JSON.stringify(error.message, null, 2)}`, LOG_PREFIX);
        throw error;
    }

}