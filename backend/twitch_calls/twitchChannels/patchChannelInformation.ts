import {twitchApiClient} from "../twitchApiConfig";
import {logger} from "../../utilities/logger";

const LOG_PREFIX = 'TWITCH_API_CHANNELS';

export type PatchChannelInformationPayload = {
    game_id?: string;
    broadcaster_language?: string;
    title?: string;
}


// Requires a user access token that includes the channel:manage:broadcast scope.
// broadcaster_id The ID of the broadcaster whose channel you want to update. This ID must match the user ID in the user access token.
export const patchChannelInformation = async (queryParams:any, payload: PatchChannelInformationPayload) => {
    try {
        const result = await twitchApiClient.patch('/channels', payload, {
            params: queryParams
        })
        return result.data
    } catch (error: any) {
        logger.error(`Error patching channel information: ${error.message}`, LOG_PREFIX);
        throw error;
    }
};



export const isPatchChannelInformationPayload = (obj: any): obj is PatchChannelInformationPayload => {
    const allowedKeys = [
        "game_id",
        "broadcaster_language",
        "title"
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
            case "game_id":
            case "broadcaster_language":
            case "title":
                return typeof value === "string";
            default:
                return false;
        }
    });

    if (!isValid) {
        throw Error(`Object contains invalid values: ${JSON.stringify(obj)}`);
    }

    return true;
};