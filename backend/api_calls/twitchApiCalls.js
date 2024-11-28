import axios from 'axios'
import {setBroadcasterId, TWITCH_BOT_OAUTH_TOKEN} from "../bot/bot.js";


const LOG_PREFIX = 'TWITCH API:'

const TWITCH_API_URL_USERS = `https://api.twitch.tv/helix/users?login=`;
const TWITCH_API_URL_STREAMS = `https://api.twitch.tv/helix/streams?user_id=`;
const TWITCH_VALIDATE_AUTH_URL = 'https://id.twitch.tv/oauth2/validate';
const TWITCH_API_URL_FETCH_USERNAME = 'https://api.twitch.tv/helix/users'


export async function fetchTwitchUserId(nickname, accessToken, clientId) {
    const url = TWITCH_API_URL_USERS + nickname

    const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Client-Id': clientId
    };

    try {
        const response = await axios.get(url, {headers});
        const userId = response.data.data[0]?.id;

        if (!userId) {
            // throw new Error('No user ID found in response');
            return {found: false, userId: null};
        }

        setBroadcasterId(userId);
        return {found: true, userId};
    } catch (error) {
        console.error(`${LOG_PREFIX} Error while fetching Twitch user ID`, error.message);
        throw error;
    }
}

export async function fetchTwitchStreamId(userId, accessToken, clientId) {
    try {
        const url = TWITCH_API_URL_STREAMS + userId

        const headers = {
            'Authorization': `Bearer ${accessToken}`,
            'Client-Id': clientId
        };

        const response = await axios.get(url, {headers});
        const streamData = response.data.data[0];

        if (!streamData) {
            console.log(`${LOG_PREFIX} Streamer is currently offline`);
            return {stream_id: undefined};
        }

        console.log(`${LOG_PREFIX} streamonline: ${streamData.title}`);

        return {
            stream_id: streamData.id,
            title: streamData.title,
            viewer_count: streamData.viewer_count,
            started_at: streamData.started_at
        };
    } catch (error) {
        console.error(`${LOG_PREFIX} Error fetching Twitch stream data:`, error);
        throw error;
    }
}

export async function validateTwitchAuth() {
    let response = await axios.get(TWITCH_VALIDATE_AUTH_URL, {
        headers: {
            'Authorization': 'OAuth ' + TWITCH_BOT_OAUTH_TOKEN
        }
    });

    if (response.status !== 200) {
        let data = await response.data();
        console.error(`${LOG_PREFIX} Token is not valid. ${TWITCH_VALIDATE_AUTH_URL} returned status code ` + response.status);
        console.error(data);
        process.exit(1);
    }

    console.log(`${LOG_PREFIX} Validated token.`);
}

export async function deleteTwitchSubscription(subscriptionId, accessToken, clientId) {
    const headers = {
        Authorization: `Bearer ${accessToken}`,
        "Client-Id": clientId,
    };

    try {
        const url = `https://api.twitch.tv/helix/eventsub/subscriptions?id=${subscriptionId}`;
        const response = await axios.delete(url, {headers});
        if (response.status === 204) {
            console.log(`${LOG_PREFIX} Successfully unsubscribed from Twitch EventSub: ${subscriptionId}`);
            return true;
        } else {
            console.warn(`${LOG_PREFIX} Unexpected response while unsubscribing:`, response.status);
            return false;
        }
    } catch (error) {
        console.error(`${LOG_PREFIX} Error unsubscribing from Twitch EventSub:`, error.response?.data || error.message);
        throw error;
    }
}

export async function fetchTwitchUserIdFromOauthToken(accessToken, clientId) {
    try {
        const response = await axios.get(TWITCH_API_URL_FETCH_USERNAME, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Client-Id': clientId,
            },
        });

        if (response.data && response.data.data && response.data.data.length > 0) {
            const user = response.data.data[0];
            return user['id']
        } else {
            throw new Error('No user data found in the response');
        }
    } catch (error) {
        console.error(`${LOG_PREFIX} Error fetching username for OAuth token:`, error.message);
        throw error;
    }
}