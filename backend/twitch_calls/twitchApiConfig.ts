import axios from 'axios';

export const twitchApiClient = axios.create({
    baseURL: 'https://api.twitch.tv/helix',
});

export function initializeTwitchApiClient(clientId: string) {
    twitchApiClient.interceptors.request.use((config) => {
        if (clientId) {
            config.headers['Client-Id'] = clientId;

            const twitchOauthToken = config.headers['x-twitch-oauth-token'];
            if (twitchOauthToken) {
                delete config.headers['x-twitch-oauth-token'];
                config.headers['Authorization'] = 'Bearer ' + twitchOauthToken;
            }
        }
        return config;
    });
}