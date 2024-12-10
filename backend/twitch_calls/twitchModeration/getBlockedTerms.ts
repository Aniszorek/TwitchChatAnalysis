import {twitchApiClient} from "../twitchApiConfig";
import {logger} from "../../utilities/logger";
import {ModUser} from "./getModerators";

const LOG_PREFIX = 'TWITCH_API_MODERATION';

export interface GetBlockedTermsResponse {
    broadcaster_id: string;
    moderator_id: string;
    id: string;
    text: string;
    created_at: string;
    updated_at: string;
    expires_at: string;
}

// Requires a user access token that includes the moderator:read:blocked_terms or moderator:manage:blocked_terms scope.
// moderator_id	The ID of the broadcaster or a user that has permission to moderate the broadcaster’s chat room. This ID must match the user ID in the user access token.
export const getBlockedTerms = async (queryParams: any): Promise<GetBlockedTermsResponse[]> => {
    try {
        let allData: GetBlockedTermsResponse[] = [];
        let cursor: string | undefined;

        do {
            const response = await twitchApiClient.get('/moderation/blocked_terms', {
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
        logger.error(`Error fetching blocked terms: ${error.message}`, LOG_PREFIX);
        throw error;
    }
};