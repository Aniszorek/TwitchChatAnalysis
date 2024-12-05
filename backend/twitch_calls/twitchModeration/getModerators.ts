import {twitchApiClient} from "../twitchApiConfig";
import {logger} from "../../utilities/logger";

const LOG_PREFIX = 'TWITCH_API_MODERATION';

export type ModUser = {
    user_id: string;
    user_login: string;
    user_name: string;
}

export const getChannelModerators = async (broadcasterId: string): Promise<ModUser[]> => {
    try {

        let allData: ModUser[] = [];
        let cursor: string | undefined;

        do {
            const response = await twitchApiClient.get('/moderation/moderators', {
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
        logger.error(`Error fetching channel moderators: ${error.message}`, LOG_PREFIX);
        throw error;
    }
};