import {twitchApiClient} from "../twitchApiConfig";
import {logger} from "../../utilities/logger";

const LOG_PREFIX = 'TWITCH_API_CHANNELS';

export type PollChoices = {
    title: string;
}

export type PostCreatePollPayload = {
    broadcaster_id: string;
    title: string;
    choices: PollChoices[],
    channel_points_voting_enabled?: boolean;
    channel_points_per_vote?: number;
    duration: number;
}


// Requires a user access token that includes the channel:manage:polls scope.
// broadcaster_id The ID of the broadcaster that’s running the poll. This ID must match the user ID in the user access token.
// todo to be tested with twitch account with partner or affiliate program
export const postCreatePoll = async (payload: PostCreatePollPayload, headers: any) => {
    try {
        const result = await twitchApiClient.post('/polls', payload, {headers: {...headers}})
        return result.data
    } catch (error: any) {
        logger.error(`Error with creating poll: ${error.message}`, LOG_PREFIX);
        throw error;
    }
};

export const isPostCreatePollPayload = (obj: any): obj is PostCreatePollPayload => {
    if (typeof obj !== "object" || obj === null) {
        throw Error(`Object is not valid: ${JSON.stringify(obj)}`);
    }

    const requiredKeys = {
        broadcaster_id: "string",
        title: "string",
        choices: "object",
        duration: "number"
    };

    for (const [key, type] of Object.entries(requiredKeys)) {
        if (!(key in obj)) {
            throw Error(`Missing required key: ${key}`);
        }
        if (typeof obj[key] !== type && key !== "choices") {
            throw Error(`Key '${key}' must be of type '${type}', got '${typeof obj[key]}'`);
        }
    }

    if (!Array.isArray(obj.choices)) {
        throw Error(`Key 'choices' must be an array`);
    }
    if (obj.choices.length > 5) {
        throw Error(`Key 'choices' must contain at most 5 items`);
    }
    if (obj.choices.length < 2) {
        throw Error(`Key 'choices' must contain at least 2 items`);
    }

    for (const choice of obj.choices) {
        if (typeof choice !== "object" || choice === null) {
            throw Error(`Each choice must be an object`);
        }
        if (typeof choice.title !== "string") {
            throw Error(`Each choice must have a 'title' of type 'string'`);
        }
        if (choice.title.length > 25) {
            throw Error(`Choice title may contain maximum of 25 characters`);
        }
    }

    if (obj.duration < 15 || obj.duration > 1800) {
        throw Error(`Duration must be between 15 and 1800 seconds`);

    }

    if( obj.title.length > 60) {
        throw Error(`Title may contain maximum of 60 characters`);
    }

    return true;
};