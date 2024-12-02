import axios from "axios";
import querystring from "querystring";
import jwt, {JwtHeader, JwtPayload} from "jsonwebtoken";
import jwksClient, {SigningKey} from "jwks-rsa";


const LOG_PREFIX = `COGNITO_AUTH:`;

const COGNITO_CLIENT_ID = process.env["COGNITO_CLIENT_ID"] as string;
const COGNITO_DOMAIN = 'https://twitchchatanalytics.auth.eu-central-1.amazoncognito.com';
const COGNITO_ISSUER = `https://cognito-idp.eu-central-1.amazonaws.com/eu-central-1_IzUkrEEsr`;
const COGNITO_TOKEN_SIGNING_URL = `${COGNITO_ISSUER}/.well-known/jwks.json`;
const COGNITO_REDIRECT_URI = 'http://localhost:3000/callback';

const COGNITO_AUTHORIZE_ENDPOINT = `${COGNITO_DOMAIN}/oauth2/authorize`;
const COGNITO_TOKEN_ENDPOINT = `${COGNITO_DOMAIN}/oauth2/token`;

const cognitoClient = jwksClient({
    jwksUri: COGNITO_TOKEN_SIGNING_URL,
});

interface CognitoTokenResponse {
    id_token: string;
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
}

interface RefreshTokenResult {
    newIdToken: string | undefined;
    newExpiryTime: number | undefined;
}

interface DecodedTokenHeader extends JwtHeader {
    kid: string;
}


/**
 * Generates aws cognito login page url
 */
export function generateAuthUrl(): string {
    const queryParams = querystring.stringify({
        response_type: "code",
        client_id: COGNITO_CLIENT_ID,
        redirect_uri: COGNITO_REDIRECT_URI,
    });
    return `${COGNITO_AUTHORIZE_ENDPOINT}?${queryParams}`;
}


/**
 * Exchanges authorization code received from AuthUrl for tokens
 */
export async function exchangeCodeForToken(authCode: string): Promise<CognitoTokenResponse> {
    const params = new URLSearchParams();
    params.append("grant_type", "authorization_code");
    params.append("client_id", COGNITO_CLIENT_ID);
    params.append("code", authCode);
    params.append("redirect_uri", COGNITO_REDIRECT_URI);

    try {
        const response = await axios.post(COGNITO_TOKEN_ENDPOINT, params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            }
        });

        return await response.data;
    } catch (error: any) {
        console.error(`${LOG_PREFIX} Error exchanging code for token:`, error.response?.data || error.message);
        throw new Error(`${LOG_PREFIX} Could not get access token`);
    }
}


async function refreshIdToken(refreshToken: string): Promise<CognitoTokenResponse> {
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

        console.log(`${LOG_PREFIX} Token refreshed:`, response.data);
        return await response.data;
    } catch (error: any) {
        throw new Error(`${LOG_PREFIX} Could not refresh access token: ${error.message}`);
    }
}

// todo trzeba przebudować to w taki sposób, aby przekazywany był request i tokeny były brane z requesta, a nie z tej struktury, bo już ich w tej strukturze nie ma
// export async function refreshIdTokenIfExpired(cognitoUserId: string): Promise<CognitoTokenResponse | undefined> {
//     const {cognitoRefreshToken, cognitoExpiryTime} = frontendClients.get(cognitoUserId)?.cognito || {};
//
//     if (!cognitoRefreshToken || !cognitoExpiryTime) {
//         console.error(`${LOG_PREFIX} Missing Cognito data for user: ${cognitoUserId}`);
//         return undefined;
//     }
//
//     if (Date.now() >= cognitoExpiryTime) {
//         console.log(`${LOG_PREFIX} ${cognitoUserId} Access token expired - refreshing`);
//         const data: CognitoTokenResponse = await refreshIdToken(cognitoRefreshToken);
//         setFrontendClientCognitoData(cognitoUserId, data.id_token, null, data.expires_in * 1000 + Date.now(), null);
//         return data;
//     }
// }


export async function refreshIdTokenIfExpiredAndNotConnectedToFE(cognitoRefreshToken: string, cognitoTokenExpiryTime: number, twitchBroadcasterUsername: string): Promise<RefreshTokenResult> {
    if (Date.now() >= cognitoTokenExpiryTime) {
        console.log(`${LOG_PREFIX} (new connection for ${twitchBroadcasterUsername}) Access token expired - refreshing`);
        const data = await refreshIdToken(cognitoRefreshToken);
        return {
            newIdToken: data.id_token,
            newExpiryTime: data.expires_in,
        };
    }
    return { newIdToken: undefined, newExpiryTime: undefined };
}


async function getSigningKey(kid: string): Promise<string> {
    const key: SigningKey = await cognitoClient.getSigningKey(kid);
    return key.getPublicKey();
}


export async function verifyToken(token: string): Promise<JwtPayload> {
    const decodedHeader = jwt.decode(token, { complete: true })?.header as DecodedTokenHeader | undefined;

    if (!decodedHeader?.kid) {
        throw new Error("Invalid token structure");
    }

    const signingKey = await getSigningKey(decodedHeader.kid);

    return jwt.verify(token, signingKey, {
        algorithms: ["RS256"],
        issuer: COGNITO_ISSUER,
    }) as JwtPayload;
}