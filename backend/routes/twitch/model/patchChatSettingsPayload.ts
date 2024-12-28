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
                return typeof value === "number" || value === null;
            default:
                return false;
        }
    });

    if (!isValid) {
        throw Error(`Object contains invalid values: ${JSON.stringify(obj)}`);
    }

    return true;
};