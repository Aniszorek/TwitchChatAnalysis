import {twitchApiClient} from "../twitchApiConfig";
import {logger} from "../../utilities/logger";

const LOG_PREFIX = 'TWITCH_API_CHANNELS';

export interface FollowersCountResponse {
    total: number;
}

export const getChannelFollowersCount = async (broadcasterId: string): Promise<number> => {
    try {
        const response = await twitchApiClient.get<FollowersCountResponse>('/channels/followers', {
            params: {
                broadcaster_id: broadcasterId,
            },
        });

        return response.data.total;
    } catch (error: any) {
        logger.error(`Error fetching channel follower count: ${error.message}`, LOG_PREFIX);
        throw error;
    }
};