import axios from 'axios';
import querystring from 'querystring';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import {frontendClients, setFrontendClientCognitoData} from "../bot/wsServer.js";


const LOG_PREFIX = `COGNITO_AUTH:`

const COGNITO_CLIENT_ID = process.env["COGNITO_CLIENT_ID"];
const COGNITO_DOMAIN = 'https://twitchchatanalytics.auth.eu-central-1.amazoncognito.com';
const COGNITO_ISSUER = `https://cognito-idp.eu-central-1.amazonaws.com/eu-central-1_IzUkrEEsr`
const COGNITO_TOKEN_SIGNING_URL = `${COGNITO_ISSUER}/.well-known/jwks.json`
const COGNITO_REDIRECT_URI = 'http://localhost:3000/callback';

const COGNITO_AUTHORIZE_ENDPOINT = `${COGNITO_DOMAIN}/oauth2/authorize`;
const COGNITO_TOKEN_ENDPOINT = `${COGNITO_DOMAIN}/oauth2/token`;

const cognitoClient = jwksClient({
    jwksUri: COGNITO_TOKEN_SIGNING_URL
});



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

        return await response.data;
    } catch (error) {
        console.error(`${LOG_PREFIX} error exchanging code for token:`, error.response ? error.response.data : error.message);
        throw new Error(`${LOG_PREFIX} Could not get access token`);
    }
}

async function refreshIdToken(refreshToken) {
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
        throw new Error(`${LOG_PREFIX} Could not refresh access token ${error.message}`);
    }
}

export async function refreshIdTokenIfExpired(cognitoUserId) {

    const {cognitoRefreshToken, cognitoExpiryTime } = frontendClients.get(cognitoUserId).cognito

    if (Date.now() >= cognitoExpiryTime) {
        console.log(`${LOG_PREFIX} ${cognitoUserId} Access token expired - refreshing`);
        const data = await refreshIdToken(cognitoRefreshToken);
        setFrontendClientCognitoData(cognitoUserId, data.id_token, null , data.expiry_time, null)
        return data
        // const data = await refreshIdToken(refreshToken);
        // cognitoIdToken = data.id_token;
        // tokenExpiryTime = Date.now() + data.expires_in * 1000;
    }
}

async function getSigningKey(kid) {
    const key = await cognitoClient.getSigningKey(kid);
    return key.getPublicKey();
}

export async function verifyToken(token) {
    const decodedHeader = jwt.decode(token, { complete: true });
    if (!decodedHeader || !decodedHeader.header) {
        throw new Error('Invalid token structure');
    }

    const signingKey = await getSigningKey(decodedHeader.header.kid);

    return jwt.verify(token, signingKey, {
        algorithms: ['RS256'],
        issuer: COGNITO_ISSUER,
    });
}