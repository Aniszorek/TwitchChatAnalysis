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
// broadcaster_id The ID of the broadcaster whose chat room the user is being banned from.
// moderator_id The ID of the broadcaster or a user that has permission to moderate the broadcaster’s chat room. This ID must match the user ID in the user access token.
export const postBanUser = async (payload: BanUserPayload) => {
    try {
        const result = await twitchApiClient.post('/moderation/bans', payload)
        return result.data
    } catch (error: any) {
        logger.error(`Error suspending user: ${error.message}`, LOG_PREFIX);
        throw error;
    }
};