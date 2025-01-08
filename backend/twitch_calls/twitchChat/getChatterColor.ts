import {twitchApiClient} from "../twitchApiConfig";
import {logger} from "../../utilities/logger";
import {ChatSettingsResponse} from "../../routes/twitch/model/getChatSettingsResponse";

const LOG_PREFIX = 'TWITCH_API_CHAT';

// Requires an app access token or user access token.
export const getChatterColor = async (queryParams: any, headers: any): Promise<ChatSettingsResponse> => {
    try {
        const result =  await twitchApiClient.get('/chat/color', {
            params: queryParams,
            headers: { ...headers }
        })
        return result.data;

    } catch (error: any) {
        logger.error(`Error fetching user chat color: ${error.message}`, LOG_PREFIX);
        throw error;
    }
};