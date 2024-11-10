import axios from 'axios'

export async function fetchTwitchUserId(nickname, accessToken, clientId) {
    const url = `https://api.twitch.tv/helix/users?login=${nickname}`;

    const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Client-Id': clientId
    };

    try {
        const response = await axios.get(url, { headers });

        const userId = response.data.data[0]?.id;

        if (!userId) {
            throw new Error('No user ID found in response');
        }

        return userId;
    } catch (error) {
        console.error('Error fetching Twitch user ID:', error);
        throw error;
    }
}