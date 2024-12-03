import {twitchApiClient} from "../twitchApiConfig";

export interface SubscriptionsCountResponse {
    total: number;
}

export const getChannelSubscriptionsCount = async (broadcasterId: string): Promise<SubscriptionsCountResponse> => {
    try {
        const response = await twitchApiClient.get<SubscriptionsCountResponse>('/subscriptions', {
            params: {
                broadcaster_id: broadcasterId,
            },
        });

        return {
            total: response.data.total,
        };
    } catch (error) {
        console.error('Error fetching channel subscription count:', error);
        throw error;
    }
};