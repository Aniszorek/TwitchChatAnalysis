import {twitchApiClient} from "../twitchApiConfig";
import {logger} from "../../utilities/logger";
import {PostCreatePollPayload} from "../../routes/twitch/model/postCreatePollPayload";

const LOG_PREFIX = 'TWITCH_API_CHANNELS';

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