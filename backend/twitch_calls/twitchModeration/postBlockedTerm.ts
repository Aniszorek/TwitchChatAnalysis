import {twitchApiClient} from "../twitchApiConfig";
import {logger} from "../../utilities/logger";
import {q} from "@noble/curves/pasta";

const LOG_PREFIX = 'TWITCH_API_MODERATION';

export type PostBlockedTermPayload = {
    text: string;
}
export const isPostBlockedTermPayload = (obj:any): obj is PostBlockedTermPayload => {
    const isOk = obj.text !== undefined
    if(isOk){
        return isOk
    }
    else{
        throw Error(`object is not valid PostBlockedTermPayload: ${JSON.stringify(obj)}`);
    }
}

// Requires a user access token that includes the moderator:manage:blocked_terms scope.
// moderator_id The ID of the broadcaster or a user that has permission to moderate the broadcaster’s chat room. This ID must match the user ID in the user access token.
export const postBlockedTerm = async (queryParams:any, payload: PostBlockedTermPayload) => {
    try {
        const result = await twitchApiClient.post('/moderation/blocked_terms', payload, {
            params: {
                ...queryParams
            }
        })
        return result.data
    } catch (error: any) {
        logger.error(`Error adding blocked term: ${error.message}`, LOG_PREFIX);
        throw error;
    }
};