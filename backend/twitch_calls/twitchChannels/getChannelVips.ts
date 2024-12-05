import {twitchApiClient} from "../twitchApiConfig";
import {logger} from "../../utilities/logger";

const LOG_PREFIX = 'TWITCH_API_CHANNELS';

export type VipUser = {
    user_id: string;
    user_login: string;
    user_name: string;
}

export const getChannelVips = async (broadcasterId: string): Promise<VipUser[]> => {
    try {

        let allData: VipUser[] = [];
        let cursor: string | undefined;

        do {
            const response = await twitchApiClient.get('/channels/vips', {
                params: {
                    broadcaster_id: broadcasterId,
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