import axios from 'axios';
import querystring from 'querystring';

const COGNITO_CLIENT_ID = process.env["COGNITO_CLIENT_ID"];
const COGNITO_DOMAIN = 'https://twitchchatanalytics.auth.eu-central-1.amazoncognito.com';
const COGNITO_REDIRECT_URI = 'http://localhost:3000/callback';

// Endpointy Cognito
const COGNITO_AUTHORIZE_ENDPOINT = `${COGNITO_DOMAIN}/oauth2/authorize`;
const COGNITO_TOKEN_ENDPOINT = `${COGNITO_DOMAIN}/oauth2/token`;

export let accessToken;
let refreshToken;
let tokenExpiryTime;

// Generuje URL do strony z logowaniem przez Cognito
export function generateAuthUrl() {
    const queryParams = querystring.stringify({
        response_type: 'code', client_id: COGNITO_CLIENT_ID, redirect_uri: COGNITO_REDIRECT_URI,
    });
    return `${COGNITO_AUTHORIZE_ENDPOINT}?${queryParams}`;
}

// Wysyła kod autoryzacyjny i wymienia go na access token
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
        accessToken = data.access_token;
        refreshToken = data.refresh_token;
        tokenExpiryTime = Date.now() + data.expires_in * 1000;
        return data;
    } catch (error) {
        console.error('Błąd podczas wymiany kodu na token:', error.response ? error.response.data : error.message);
        throw new Error('Nie udało się uzyskać tokenu');
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
        return response.data;
    } catch (error) {
        throw new Error('Nie udało się odswierzyc tokenu');
    }
}

export async function ensureValidAccessToken() {
    if (Date.now() >= tokenExpiryTime) {
        console.log('Token wygasł, odświeżam...');
        const data = await refreshAccessToken(refreshToken);
        accessToken = data.accessToken;
        tokenExpiryTime = Date.now() + data.expires_in * 1000;
    }
}

export function getAccessToken() {
    return accessToken;
}
