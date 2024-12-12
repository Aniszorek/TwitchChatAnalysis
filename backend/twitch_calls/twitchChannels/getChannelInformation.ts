import {twitchApiClient} from "../twitchApiConfig";
import {logger} from "../../utilities/logger";

const LOG_PREFIX = 'TWITCH_API_CHANNELS';

export interface ChannelInformationResponse {
    data: {
        game_id: string;
        title: string;
        tags: string[]
    }
}

// Requires an app access token or user access token.
export const getChannelInformation = async (queryParams: any): Promise<ChannelInformationResponse> => {
    try {
        const result =  await twitchApiClient.get('/channels', {
            params: queryParams
        })
        return result.data;

    } catch (error: any) {
        logger.error(`Error fetching channel information: ${error.message}`, LOG_PREFIX);
        throw error;
    }
};