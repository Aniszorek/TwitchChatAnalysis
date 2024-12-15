import axios from 'axios';
import {CLIENT_ID} from "../envConfig";

export const twitchApiClient = axios.create({
    baseURL: 'https://api.twitch.tv/helix',
});

export function initializeTwitchApiClient(accessToken: string, clientId: string) {
    twitchApiClient.interceptors.request.use((config) => {
        if (accessToken && clientId) {
            config.headers['Authorization'] = `Bearer ${accessToken}`;
            config.headers['Client-Id'] = clientId;
        }
        return config;
    });
}