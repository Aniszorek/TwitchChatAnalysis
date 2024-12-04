import {twitchApiClient} from "../twitchApiConfig";
import {logger} from "../../utilities/logger";

const LOG_PREFIX = 'TWITCH_API_USERS';

export type SuspendedUser = {
    user_id: string;
    user_login: string;
    user_name: string;
    expires_at: string;
    created_at: string;
    reason: string;
    moderator_id: string;
    moderator_login: string;
    moderator_name: string;
};

export type SuspendedUsersResponse = {
    banned_users: SuspendedUser[];
    timed_out_users: SuspendedUser[];
};


/**
 * Public function to get banned and timed-out users for a broadcaster.
 */
export async function getSuspendedUsers(broadcasterId: string): Promise<SuspendedUsersResponse> {
    try {
        // Fetch all banned users using pagination
        const allUsers = await fetchAllBannedUsers(broadcasterId);

        // Filter users into separate categories
        const bannedUsers = filterBannedUsers(allUsers);
        const timedOutUsers = filterTimedOutUsers(allUsers);

        return {banned_users: bannedUsers, timed_out_users: timedOutUsers};
    } catch (error: any) {
        logger.error(`Error in getBannedUsers: ${error.message}`, LOG_PREFIX);
        throw new Error('Failed to retrieve banned users from Twitch API');
    }
}

/**
 * Private function to fetch all banned users with pagination.
 */
async function fetchAllBannedUsers(broadcasterId: string): Promise<SuspendedUser[]> {
    let allData: SuspendedUser[] = [];
    let cursor: string | undefined;

    do {
        const response = await twitchApiClient.get('/moderation/banned', {
            params: {
                broadcaster_id: broadcasterId,
                after: cursor,
            },
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


