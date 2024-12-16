import {twitchApiClient} from "../twitchApiConfig";
import {logger} from "../../utilities/logger";

const LOG_PREFIX = 'TWITCH_API_CHANNELS';

export type PatchChannelInformationPayload = {
    game_id?: string;
    broadcaster_language?: string;
    title?: string;
    tags?: string[]
}


// Requires a user access token that includes the channel:manage:broadcast scope.
// broadcaster_id The ID of the broadcaster whose channel you want to update. This ID must match the user ID in the user access token.
export const patchChannelInformation = async (queryParams:any, payload: PatchChannelInformationPayload, headers:any) => {
    try {
        const result = await twitchApiClient.patch('/channels', payload, {
            params: queryParams,
            headers: { ...headers }
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
        "title",
        "tags"
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
            case "tags":
                return Array.isArray(value);
            default:
                return false;
        }
    });

    if (!isValid) {
        throw Error(`Object contains invalid values: ${JSON.stringify(obj)}`);
    }

    // check if tags meets requirements specified by TwitchApi
    if (obj.tags) {
        // Max 10 tags
        if (obj.tags.length > 10) {
            throw Error(`Maximum of 10 tags allowed`);
        }
        obj.tags.forEach((tag: string) => {
            if (tag.length > 25) {
                throw Error(`Maximum tag length is 25 characters`);
            }
            if (tag.trim().length === 0) {
                throw Error(`No empty tags allowed`);
            }
        });
    }


    return true;
};