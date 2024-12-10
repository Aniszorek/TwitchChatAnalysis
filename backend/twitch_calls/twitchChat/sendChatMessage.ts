import {twitchApiClient} from "../twitchApiConfig";
import {logger} from "../../utilities/logger";

const LOG_PREFIX = 'TWITCH_API_CHAT';

export type SendChatMessagePayload = {
    broadcaster_id: string;
    sender_id: string;
    message: string;
}
export const isSendChatMessagePayload = (obj:any): obj is SendChatMessagePayload => {
    const isOk = obj.broadcaster_id !== undefined &&
        obj.sender_id !== undefined &&
        obj.message !== undefined

    if(isOk){
        return isOk
    }
    else{
        throw Error(`object is not valid SendChatMessagePayload: ${JSON.stringify(obj)}`);
    }
}

// Requires an app access token or user access token that includes the user:write:chat scope.
// If app access token used, then additionally requires user:bot scope from chatting user, and either channel:bot scope from broadcaster or moderator status.
export const postChatMessage = async (payload: SendChatMessagePayload) => {
    try {
        const result = await twitchApiClient.post('/chat/messages', payload)
        return result.data
    } catch (error: any) {
        logger.error(`Error sending chat message: ${error.message}`, LOG_PREFIX);
        throw error;
    }
};