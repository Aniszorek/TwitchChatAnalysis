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
        const { authorization, broadcasteruserlogin } = config.headers;

        if (authorization && broadcasteruserlogin) {
            delete config.headers['authorization'];
            delete config.headers['broadcasteruserlogin'];

            config.headers['Authorization'] = authorization;
            config.headers['BroadcasterUserLogin'] = broadcasteruserlogin;
        }

        return config;
    });
}
