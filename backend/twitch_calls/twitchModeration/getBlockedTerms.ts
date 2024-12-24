import {twitchApiClient} from "../twitchApiConfig";
import {logger} from "../../utilities/logger";
import {GetBlockedTermsResponse} from "../../routes/twitch/model/getBlockedTermsResponse";

const LOG_PREFIX = 'TWITCH_API_MODERATION';

// Requires a user access token that includes the moderator:read:blocked_terms or moderator:manage:blocked_terms scope.
// moderator_id	The ID of the broadcaster or a user that has permission to moderate the broadcaster’s chat room. This ID must match the user ID in the user access token.
export const getBlockedTerms = async (queryParams: any, headers:any): Promise<GetBlockedTermsResponse[]> => {
    try {
        let allData: GetBlockedTermsResponse[] = [];
        let cursor: string | undefined;

        do {
            const response = await twitchApiClient.get('/moderation/blocked_terms', {
                params: {
                    ...queryParams,
                    after: cursor,
                },
                headers: {
                    ...headers
                }
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