import {twitchApiClient} from "../twitchApiConfig";
import {logger} from "../../utilities/logger";

const LOG_PREFIX = 'TWITCH_API_MODERATION';

export interface AutomodSettingsResponse {
    data: {
        broadcaster_id: string;
        moderator_id: string;
        overall_level: number;
        disability: number;
        aggression: number;
        sexuality_sex_or_gender: number;
        misogyny: number;
        bullying: number;
        swearing: number;
        race_ethnicity_or_religion: number;
        sex_based_terms: number;
    }
}
// Requires a user access token that includes the moderator:read:automod_settings scope.
// moderator_id The ID of the broadcaster or a user that has permission to moderate the broadcaster’s chat room. This ID must match the user ID in the user access token.
export const getAutomodSettings = async (queryParams: any, headers:any): Promise<AutomodSettingsResponse> => {
    try {
        const result =  await twitchApiClient.get('/moderation/automod/settings', {
            params: queryParams,
            headers: { ...headers }
        })
        return result.data;

    } catch (error: any) {
        logger.error(`Error fetching automod settings: ${error.message}`, LOG_PREFIX);
        throw error;
    }
};