import {twitchApiClient} from "../twitchApiConfig";

const LOG_PREFIX = "TWITCH+API_CHANNELS:"

export interface SubscriptionsCountResponse {
    total: number;
}

export const getChannelSubscriptionsCount = async (broadcasterId: string): Promise<number> => {
    try {
        const response = await twitchApiClient.get<SubscriptionsCountResponse>('/subscriptions', {
            params: {
                broadcaster_id: broadcasterId,
            },
        });

        return response.data.total
    } catch (error) {
        console.error(`${LOG_PREFIX} Error fetching channel subscription count:`, error);
        throw error;
    }
};