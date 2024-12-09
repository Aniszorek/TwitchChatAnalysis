import {twitchApiClient} from "../twitchApiConfig";
import {logger} from "../../utilities/logger";

const LOG_PREFIX = "TWITCH_API_CHANNELS"

export interface SubscriptionsCountResponse {
    total: number;
}
// Requires a user access token that includes the channel:read:subscriptions scope.
// broadcaster_id 	The broadcaster’s ID. This ID must match the user ID in the access token.
export const getChannelSubscriptionsCount = async (broadcasterId: string): Promise<number> => {
    try {
        const response = await twitchApiClient.get<SubscriptionsCountResponse>('/subscriptions', {
            params: {
                broadcaster_id: broadcasterId,
            },
        });

        return response.data.total
    } catch (error: any) {
        logger.error(`Error fetching channel subscription count: ${error.message}`, LOG_PREFIX);
        throw error;
    }
};