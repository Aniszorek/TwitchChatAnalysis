import axios from 'axios';
import {CLIENT_ID} from "../envConfig";

export const twitchApiClient = axios.create({
    baseURL: 'https://api.twitch.tv/helix',
});

export function initializeTwitchApiClient(accessToken: string) {
    twitchApiClient.interceptors.request.use((config) => {
        config.headers['Authorization'] = `Bearer ${accessToken}`;
        config.headers['Client-Id'] = CLIENT_ID;
        return config;
    });
}

export function createTwitchApiClient(accessToken: string) {
    return axios.create({
        baseURL: 'https://api.twitch.tv/helix',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Client-Id': CLIENT_ID,
        },
    });
}
