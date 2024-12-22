import {twitchApiClient} from "../twitchApiConfig";
import {logger} from "../../utilities/logger";
import {FollowersCountResponse} from "../../routes/twitch/model/getChannelFollowersResponse";

const LOG_PREFIX = 'TWITCH_API_CHANNELS';

// Requires a user access token that includes the moderator:read:followers scope.
// The ID in the broadcaster_id query parameter must match the user ID in the access token or the user ID in the access token must be a moderator for the specified broadcaster.
export const getChannelFollowersCount = async (queryParams: any, headers:any): Promise<number> => {
    try {
        const response = await twitchApiClient.get<FollowersCountResponse>('/channels/followers', {
            params: {
                ...queryParams
            },
            headers: { ...headers }
        });

        return response.data.total;
    } catch (error: any) {
        logger.error(`Error fetching channel follower count: ${error.message}`, LOG_PREFIX);
        throw error;
    }
};