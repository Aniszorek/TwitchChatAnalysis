import {twitchApiClient} from "../twitchApiConfig";
import {logger} from "../../utilities/logger";
import {SearchCategoriesResponse} from "../../routes/twitch/model/getSearchCategoriesResponse";

const LOG_PREFIX = 'TWITCH_API_SEARCH';

// Requires an app access token or user access token.
// query The URI-encoded search string. For example, encode #archery as %23archery and search strings like angel of death as angel%20of%20death.
export const getSearchCategories = async (queryParams: any, headers:any): Promise<SearchCategoriesResponse> => {
    try {
        const response = await twitchApiClient.get('/search/categories', {params: {...queryParams}, headers: {...headers}});
        return response.data
    } catch (error: any) {
        logger.error(`Error searching categories: ${error.message}`, LOG_PREFIX);
        throw error;
    }
};