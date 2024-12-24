import {twitchApiClient} from "../twitchApiConfig";
import {logger} from "../../utilities/logger";
import {ModUser} from "../../routes/twitch/model/getChannelModeratorsResponse";

const LOG_PREFIX = 'TWITCH_API_MODERATION';

// Requires a user access token that includes the moderation:read scope.
// broadcaster_id The ID of the broadcaster whose list of moderators you want to get. This ID must match the user ID in the access token.
export const getChannelModerators = async (queryParams: any, headers: any): Promise<ModUser[]> => {
    try {

        let allData: ModUser[] = [];
        let cursor: string | undefined;
        do {
            const response = await twitchApiClient.get('/moderation/moderators', {
                params: {
                    ...queryParams,
                    after: cursor,
                },
                headers: {
                    ...headers
                },
            });

            const {data, pagination} = response.data;
            allData = allData.concat(data);
            cursor = pagination?.cursor;
        } while (cursor);
        return allData

    } catch (error: any) {
        logger.error(`Error fetching channel moderators: ${error.message}`, LOG_PREFIX);
        throw error;
    }
};