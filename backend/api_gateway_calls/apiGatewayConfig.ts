import axios, {AxiosHeaders, InternalAxiosRequestConfig} from 'axios';

export interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
    broadcasterUserLogin?: string;
    cognitoIdToken?: string;
}

export const apiGatewayClient = axios.create({
    baseURL: 'https://t7pqmsv4x4.execute-api.eu-central-1.amazonaws.com/test',
});

export function initializeApiGatewayClient() {
    apiGatewayClient.interceptors.request.use((config: CustomAxiosRequestConfig) => {
        const { cognitoIdToken, broadcasterUserLogin } = config;

        if (!config.headers) {
            config.headers = new AxiosHeaders();
        }

        if (cognitoIdToken && broadcasterUserLogin) {
            config.headers.set('Authorization', `Bearer ${cognitoIdToken}`);
            config.headers.set('BroadcasterUserLogin', broadcasterUserLogin);
        }

        config.headers.set('Content-Type', 'application/json');

        return config;
    });
}
