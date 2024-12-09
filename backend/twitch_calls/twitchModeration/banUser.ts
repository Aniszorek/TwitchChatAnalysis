import {twitchApiClient} from "../twitchApiConfig";
import {logger} from "../../utilities/logger";

const LOG_PREFIX = 'TWITCH_API_MODERATION';

export type BanUserPayload = {
    broadcaster_id: string;
    moderator_id: string;
    data: {
        user_id: string,
        duration?: number; // in seconds
        reason?: string
    }
}
export const isBanUserPayload = (obj:any): obj is BanUserPayload => {
    const isOk = obj.broadcaster_id !== undefined &&
            obj.moderator_id !== undefined &&
            obj.data !== undefined &&
            obj.data.user_id !== undefined
    if(isOk){
        return isOk
    }
    else{
        throw Error(`object is not valid BanUserPayload: ${JSON.stringify(obj)}`);
    }
}

// Requires a user access token that includes the moderator:manage:banned_users scope.
export const postBanUser = async (payload: BanUserPayload) => {
    try {
        const result = await twitchApiClient.post('/moderation/bans', payload)
        return result.data
    } catch (error: any) {
        logger.error(`Error suspending user: ${error.message}`, LOG_PREFIX);
        throw error;
    }
};