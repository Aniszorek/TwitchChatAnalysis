import {twitchApiClient} from "../twitchApiConfig";
import {logger} from "../../utilities/logger";

const LOG_PREFIX = 'TWITCH_API_CHAT';

export type PatchChatSettingsPayload = {
    emote_mode?: boolean;
    follower_mode?: boolean;
    follower_mode_duration?: number;
    non_moderator_chat_delay?: boolean;
    non_moderator_chat_delay_duration?: number;
    slow_mode?: boolean;
    slow_mode_wait_time?: number;
    subscriber_mode?: boolean;
    unique_chat_mode?: boolean;

}


// Requires a user access token that includes the moderator:manage:chat_settings scope.
// moderator_id	The ID of a user that has permission to moderate the broadcaster’s chat room,
// or the broadcaster’s ID if they’re making the update. This ID must match the user ID in the user access token.
export const patchChatSettings = async (queryParams:any, payload: PatchChatSettingsPayload) => {
    try {
        const result = await twitchApiClient.patch('/chat/settings', payload, {
            params: queryParams
        })
        return result.data
    } catch (error: any) {
        logger.error(`Error patching chat settings: ${error.message}`, LOG_PREFIX);
        throw error;
    }
};



export const isPatchChatSettingsPayload = (obj: any): obj is PatchChatSettingsPayload => {
    const allowedKeys = [
        "emote_mode",
        "follower_mode",
        "follower_mode_duration",
        "non_moderator_chat_delay",
        "non_moderator_chat_delay_duration",
        "slow_mode",
        "slow_mode_wait_time",
        "subscriber_mode",
        "unique_chat_mode",
    ];

    if (typeof obj !== "object" || obj === null) {
        throw Error(`Object is not valid: ${JSON.stringify(obj)}`);
    }

    for (const key of Object.keys(obj)) {
        if (!allowedKeys.includes(key)) {
            throw Error(`Object contains invalid key: ${key}`);
        }
    }

    const isValid = Object.entries(obj).every(([key, value]) => {
        switch (key) {
            case "emote_mode":
            case "follower_mode":
            case "non_moderator_chat_delay":
            case "slow_mode":
            case "subscriber_mode":
            case "unique_chat_mode":
                return typeof value === "boolean";
            case "follower_mode_duration":
            case "non_moderator_chat_delay_duration":
            case "slow_mode_wait_time":
                return typeof value === "number";
            default:
                return false;
        }
    });

    if (!isValid) {
        throw Error(`Object contains invalid values: ${JSON.stringify(obj)}`);
    }

    return true;
};