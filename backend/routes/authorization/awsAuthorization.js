import express from 'express';

import {exchangeCodeForToken, generateAuthUrl, verifyToken} from '../../aws/cognitoAuth.js';
import {
    CLIENT_ID, startWebSocketClient, TWITCH_BOT_OAUTH_TOKEN
} from '../../bot/bot.js';
import {validateTwitchAuth,} from '../../api_calls/twitchApiCalls.js';
import {connectAwsWebSocket} from "../../aws/websocketApi.js";
import {validateUserRole} from "../../aws/apiGateway.js";


const LOG_PREFIX = `ROUTE_AWS_AUTHORIZATION:`;

export const authRouter = express.Router();

authRouter.get('/auth-url', (req, res) => {
    const authUrl = generateAuthUrl();
    console.log(`${LOG_PREFIX} Redirecting to authUrl`)
    res.redirect(authUrl);
})


authRouter.get('/callback', async (req, res) => {
    const {code} = req.query;

    if (!code) {
        return res.status(400).send('Brak kodu autoryzacyjnego');
    }

    // after successful login:
    try {
        const tokenResponse = await exchangeCodeForToken(code);
        const idToken = tokenResponse['id_token'];
        const refreshToken = tokenResponse['refresh_token'];
        const expireTime = Date.now() + tokenResponse['expires_in'] * 1000

        const redirectUrl = `http://localhost:4200/auth-callback?successful=true&idToken=${idToken}&refreshToken=${refreshToken}&expireTime=${expireTime}`;
        console.log(`${LOG_PREFIX} Redirecting with tokens`);
        res.redirect(redirectUrl);
    } catch (error) {
        console.error(`${LOG_PREFIX} Error during token exchange:`, error);
        res.redirect('http://localhost:4200/auth-callback?successful=false');
    }
})


authRouter.post('/set-twitch-username', async (req, res) => {
    // todo: dodać tutaj weryfikacje tokena cognito
    const cognitoIdToken = req.body["cognitoIdToken"];
    const cognitoRefreshToken = req.body["cognitoRefreshToken"];
    const cognitoTokenExpiryTime = req.body["cognitoTokenExpiryTime"];

    // sub is a part of jwt, and it can be used as identifier for Cognito user
    // we will use it to determine to which websocket connection messages should be forwarded
    const cognitoUserId = (await verifyToken(cognitoIdToken)).sub

    const twitchUsername = req.body["twitchUsername"];

    if (!twitchUsername) {
        return res.status(400).send('Brak nazwy użytkownika Twitch');
    }

    try {
        await validateTwitchAuth();
        // Validate role for user
        await validateUserRole(TWITCH_BOT_OAUTH_TOKEN, twitchUsername, CLIENT_ID, cognitoIdToken, cognitoRefreshToken, cognitoTokenExpiryTime)
        // Połącz z Twitch Websocket API
        const result = await startWebSocketClient(twitchUsername, cognitoIdToken, cognitoRefreshToken, cognitoTokenExpiryTime, cognitoUserId);
        if (!result.success) {
            return res.status(404).send({message: result.message});
        }
        // Połącz z AWS Websocket API
        connectAwsWebSocket(twitchUsername, cognitoIdToken)


        res.send({message: 'Streamer found and WebSocket initialized'});
    } catch (error) {
        console.error(`${LOG_PREFIX} starting WebSocket client:`, error);
        res.status(500).send('Błąd podczas uruchamiania klienta WebSocket');
    }
});


authRouter.post('/verify-cognito', async (req, res) => {
    try{
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).send('idToken is required');
        }

        await verifyToken(idToken);

        res.status(200).json({
            message: "verified",
            idToken
        });
    }
    catch (e){
        console.error(`${LOG_PREFIX} Error during verify idToken:`, e.message);
        res.status(401).json({message: 'idToken not verified', error: e.message});
    }
})