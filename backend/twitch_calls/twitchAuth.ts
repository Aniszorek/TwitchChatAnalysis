import axios, {AxiosResponse} from 'axios';
import {twitchApiClient} from "./twitchApiConfig";
import {TWITCH_BOT_OAUTH_TOKEN} from "../envConfig";
import {LogColor, logger} from "../utilities/logger";

const LOG_PREFIX = 'TWITCH_API_AUTH';
const TWITCH_VALIDATE_AUTH_URL = 'https://id.twitch.tv/oauth2/validate';

interface TwitchUserIdResponse {
    found: boolean;
    userId: string | null;
}

export interface TwitchStreamData {
    stream_id: string | undefined;
    title?: string;
    viewer_count?: number;
    started_at?: string;
    category?: string;
}


/**
 * Fetches the Twitch User ID based on the user's nickname
 */
export async function fetchTwitchUserId(nickname: string): Promise<TwitchUserIdResponse> {
    try {
        const response = await twitchApiClient.get('/users', {
            params: { login: nickname },
        });
        const userId = response.data.data[0]?.id;

        if (!userId) {
            return {found: false, userId: null};
        }

        return {found: true, userId};

    } catch (error: any) {
        logger.error(`Error while fetching Twitch user ID ${error.message}`, LOG_PREFIX);
        throw error;
    }
}


/**
 * Fetches Twitch stream data for a specific user ID
 */
export async function fetchTwitchStreamMetadata(userId: string): Promise<TwitchStreamData> {
    try {
        const response = await twitchApiClient.get('/streams', {
            params: { user_id: userId },
        });

        const streamData = response.data.data[0];

        if (!streamData) {
            logger.info(`Streamer is currently offline`, LOG_PREFIX, {color: LogColor.MAGENTA_BRIGHT});
            return {stream_id: undefined};
        }

        return {
            stream_id: streamData.id,
            title: streamData.title,
            viewer_count: streamData.viewer_count,
            started_at: streamData.started_at,
            category: streamData.game_name
        };
    } catch (error: any) {
        logger.error(`Error fetching Twitch stream data: ${error.message}`, LOG_PREFIX);
        throw error;
    }
}


/**
 * Validates the OAuth token for the Twitch bot
 */
export async function validateTwitchAuth() {
    // todo czy wywołanie tej funkcji dla niepoprawnego tokenu zrobi cokolwiek poza errorem w konsoli? musi pojawić się jakiś return i if przy wywołaniu
    try {
        const response: AxiosResponse = await axios.get(TWITCH_VALIDATE_AUTH_URL, {
            headers: {
                Authorization: `OAuth ${TWITCH_BOT_OAUTH_TOKEN}`,
            },
        });

        if (response.status !== 200) {
            logger.error(
                `Token is not valid. ${TWITCH_VALIDATE_AUTH_URL} returned status code ${response.status}`,
                LOG_PREFIX
            );
        }

        logger.info(`Validated token.`, LOG_PREFIX, {color: LogColor.MAGENTA_BRIGHT});
    } catch (error: any) {
        logger.error(`Error validating token: ${error.message}`, LOG_PREFIX);
        throw error;
    }
}


/**
 * Deletes a Twitch EventSub subscription by its ID.
 */
export async function deleteTwitchSubscription(subscriptionId: string, accessToken: string, clientId: string): Promise<boolean> {
    try {
        const response = await twitchApiClient.delete('/eventsub/subscriptions', {
            params: { id: subscriptionId },
        });

        if (response.status === 204) {
            logger.info(`Successfully unsubscribed from Twitch EventSub: ${subscriptionId}`, LOG_PREFIX, {color: LogColor.MAGENTA_BRIGHT});
            return true;
        } else {
            logger.error(`Unexpected response while unsubscribing: ${response.status}`, LOG_PREFIX);
            return false;
        }
    } catch (error: any) {
        logger.error(`Error unsubscribing from Twitch EventSub: ${error.response?.data || error.message}`, LOG_PREFIX);
        throw error;
    }
}


/**
 * Fetches the Twitch User ID using an OAuth token.
 */
export async function fetchTwitchUserIdFromOauthToken(): Promise<string> {
    try {
        const response = await twitchApiClient.get('/users');

        const user = response.data.data[0];
        if (!user) {
            throw new Error('No user data found in the response');
        }
        return user['id'];

    } catch (error: any) {
        console.error(`${LOG_PREFIX} Error fetching username for OAuth token:`, error.message);
        throw error;
    }
}