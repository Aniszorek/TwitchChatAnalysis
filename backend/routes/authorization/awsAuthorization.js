import express from 'express';
import jwt from 'jsonwebtoken';

import {exchangeCodeForToken, generateAuthUrl} from '../../aws/cognitoAuth.js';
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

        const redirectUrl = `http://localhost:4200/auth-callback?successful=true&idToken=${idToken}&refreshToken=${refreshToken}`;
        console.log(`${LOG_PREFIX} Redirecting with tokens`);
        res.redirect(redirectUrl);
    } catch (error) {
        console.error(`${LOG_PREFIX} Error during token exchange:`, error);
        res.redirect('http://localhost:4200/auth-callback?successful=false');
    }
})


authRouter.post('/set-twitch-username', async (req, res) => {
    const twitchUsername = req.body.twitchUsername;
    if (!twitchUsername) {
        return res.status(400).send('Brak nazwy użytkownika Twitch');
    }

    try {
        await validateTwitchAuth();
        // Validate role for user
        await validateUserRole(TWITCH_BOT_OAUTH_TOKEN, twitchUsername, CLIENT_ID)
        // Połącz z Twitch Websocket API
        const result = await startWebSocketClient(twitchUsername);
        if (!result.success) {
            return res.status(404).send({message: result.message});
        }
        // Połącz z AWS Websocket API
        connectAwsWebSocket(twitchUsername)


        res.send({message: 'Streamer found and WebSocket initialized'});
    } catch (error) {
        console.error(`${LOG_PREFIX} starting WebSocket client:`, error);
        res.status(500).send('Błąd podczas uruchamiania klienta WebSocket');
    }
});

