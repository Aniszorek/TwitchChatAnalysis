import {twitchApiClient} from "../twitchApiConfig";
import {logger} from "../../utilities/logger";

const LOG_PREFIX = 'TWITCH_API_CHANNELS';

export type VipUser = {
    user_id: string;
    user_login: string;
    user_name: string;
}
// Requires a user access token that includes the channel:read:vips scope.
// broadcaster_id The ID of the broadcaster whose list of VIPs you want to get. This ID must match the user ID in the access token.
export const getChannelVips = async (queryParams: any): Promise<VipUser[]> => {
    try {

        let allData: VipUser[] = [];
        let cursor: string | undefined;

        do {
            const response = await twitchApiClient.get('/channels/vips', {
                params: {
                    ...queryParams,
                    after: cursor,
                },
            });

            const {data, pagination} = response.data;
            allData = allData.concat(data);
            cursor = pagination?.cursor;
        } while (cursor);
        return allData

    } catch (error: any) {
        logger.error(`Error fetching channel VIP\'s: ${error.message}`, LOG_PREFIX);
        throw error;
    }
};