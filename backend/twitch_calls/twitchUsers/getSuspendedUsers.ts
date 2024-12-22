import {twitchApiClient} from "../twitchApiConfig";
import {logger} from "../../utilities/logger";
import {SuspendedUser, SuspendedUsersResponse} from "../../routes/twitch/model/getSuspendedUsersResponse";

const LOG_PREFIX = 'TWITCH_API_USERS';

/**
 * Public function to get banned and timed-out users for a broadcaster.
 */
export async function getSuspendedUsers(queryParams: any, headers:any): Promise<SuspendedUsersResponse> {
    try {
        // Fetch all banned users using pagination
        const allUsers = await fetchAllBannedUsers(queryParams, headers);

        // Filter users into separate categories
        const bannedUsers = filterBannedUsers(allUsers);
        const timedOutUsers = filterTimedOutUsers(allUsers);

        return {banned_users: bannedUsers, timed_out_users: timedOutUsers};
    } catch (error: any) {
        logger.error(`Error in getBannedUsers: ${error.message}`, LOG_PREFIX);
        throw error
    }
}

/**
 * Private function to fetch all banned users with pagination.
 */
// Requires a user access token that includes the moderation:read or moderator:manage:banned_users scope
// broadcaster_id The ID of the broadcaster whose list of banned users you want to get. This ID must match the user ID in the access token.
async function fetchAllBannedUsers(queryParams: any, headers:any): Promise<SuspendedUser[]> {
    let allData: SuspendedUser[] = [];
    let cursor: string | undefined;

    do {
        const response = await twitchApiClient.get('/moderation/banned', {
            params: {
                ...queryParams,
                after: cursor,
            },
            headers: { ...headers }
        });

        const {data, pagination} = response.data;
        allData = allData.concat(data);
        cursor = pagination?.cursor;
    } while (cursor);

    return allData;
}

/**
 * Private function to filter out permanently banned users.
 */
function filterBannedUsers(users: SuspendedUser[]): SuspendedUser[] {
    return users.filter(user => !user.expires_at); // No expiration date = permanent ban
}

/**
 * Private function to filter out users with timeouts.
 */
function filterTimedOutUsers(users: SuspendedUser[]): SuspendedUser[] {
    return users.filter(user => user.expires_at); // Has expiration date = timeout
}


