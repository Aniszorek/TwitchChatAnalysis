import {twitchApiClient} from "../twitchApiConfig";
import {logger} from "../../utilities/logger";
import {ChannelInformationResponse} from "../../routes/twitch/model/getChannelInformationResponse";

const LOG_PREFIX = 'TWITCH_API_CHANNELS';

// Requires an app access token or user access token.
export const getChannelInformation = async (queryParams: any, headers: any): Promise<ChannelInformationResponse> => {
    try {
        const result =  await twitchApiClient.get('/channels', {
            params: queryParams,
            headers: { ...headers }
        })
        return result.data;

    } catch (error: any) {
        logger.error(`Error fetching channel information: ${error.message}`, LOG_PREFIX);
        throw error;
    }
};