import axios from 'axios';
import querystring from 'querystring';

const LOG_PREFIX = `COGNITO_AUTH:`

const COGNITO_CLIENT_ID = process.env["COGNITO_CLIENT_ID"];
const COGNITO_DOMAIN = 'https://twitchchatanalytics.auth.eu-central-1.amazoncognito.com';
const COGNITO_REDIRECT_URI = 'http://localhost:3000/callback';

const COGNITO_AUTHORIZE_ENDPOINT = `${COGNITO_DOMAIN}/oauth2/authorize`;
const COGNITO_TOKEN_ENDPOINT = `${COGNITO_DOMAIN}/oauth2/token`;

export let cognitoAccessToken;
let refreshToken;
let tokenExpiryTime;

export function generateAuthUrl() {
    const queryParams = querystring.stringify({
        response_type: 'code', client_id: COGNITO_CLIENT_ID, redirect_uri: COGNITO_REDIRECT_URI,
    });
    return `${COGNITO_AUTHORIZE_ENDPOINT}?${queryParams}`;
}

export async function exchangeCodeForToken(authCode) {
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('client_id', COGNITO_CLIENT_ID);
    params.append('code', authCode);
    params.append('redirect_uri', COGNITO_REDIRECT_URI);

    try {
        const response = await axios.post(COGNITO_TOKEN_ENDPOINT, params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            }
        });

        const data = await response.data;
        cognitoAccessToken = data.access_token;
        refreshToken = data.refresh_token;
        tokenExpiryTime = Date.now() + data.expires_in * 1000;
        return data;
    } catch (error) {
        console.error(`${LOG_PREFIX} error exchanging code for token:`, error.response ? error.response.data : error.message);
        throw new Error(`${LOG_PREFIX} Could not get access token`);
    }
}

async function refreshAccessToken(refreshToken) {
    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('client_id', COGNITO_CLIENT_ID);
    params.append('refresh_token', refreshToken);

    try {
        const response = await axios.post(COGNITO_TOKEN_ENDPOINT, params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const data = await response.data;
        console.log(`${LOG_PREFIX} token refreshed:`, data);

        return data;
    } catch (error) {
        throw new Error(`${LOG_PREFIX} Could not refresh access token`);
    }
}

export async function ensureValidAccessToken() {

    if (Date.now() >= tokenExpiryTime) {
        console.log(`${LOG_PREFIX} Access token expired - refreshing`);
        const data = await refreshAccessToken(refreshToken);
        cognitoAccessToken = data.access_token;
        tokenExpiryTime = Date.now() + data.expires_in * 1000;

    }
}

export function getCognitoAccessToken() {
    return cognitoAccessToken;
}
