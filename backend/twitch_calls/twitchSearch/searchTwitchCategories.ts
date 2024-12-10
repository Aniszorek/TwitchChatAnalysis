import {twitchApiClient} from "../twitchApiConfig";
import {logger} from "../../utilities/logger";

const LOG_PREFIX = 'TWITCH_API_SEARCH';

export type SearchCategoriesResponse = {
    data: {
        box_art_url: string;
        name: string;
        id: string
    }
}

// Requires an app access token or user access token.
// query The URI-encoded search string. For example, encode #archery as %23archery and search strings like angel of death as angel%20of%20death.
export const getSearchCategories = async (queryParams: any): Promise<SearchCategoriesResponse> => {
    try {
        const response = await twitchApiClient.get('/search/categories', {params: {...queryParams}});
        return response.data
    } catch (error: any) {
        logger.error(`Error searching categories: ${error.message}`, LOG_PREFIX);
        throw error;
    }
};