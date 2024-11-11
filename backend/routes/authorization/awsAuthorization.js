import express from 'express';

import {
    startWebSocketClient,
    TWITCH_BOT_OAUTH_TOKEN,
    CLIENT_ID,
    getTwitchUserId
} from '../../bot/bot.js';
import {exchangeCodeForToken} from '../../aws/cognitoAuth.js';
import path from 'path';
import { fileURLToPath } from 'url';
import {fetchTwitchStreamId, fetchTwitchUserId, validateTwitchAuth} from '../../api_calls/twitchApiCalls.js';
import {connectAwsWebSocket} from "../../aws/websocketApi.js";


const LOG_PREFIX = `ROUTE_AWS_AUTHORIZATION:`;

export const authRouter = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

authRouter.get('/callback', async (req, res) => {
    const {code} = req.query;

    if (!code) {
        res.status(400).send('Brak kodu autoryzacyjnego');
        return;
    }

    try {

        // after successful login:

        const tokenResponse = await exchangeCodeForToken(code);

        // console.log(`${LOG_PREFIX} Received tokens:`, tokenResponse);
        console.log(`${LOG_PREFIX} Received tokens`);

        // res.send('Logowanie zakończone pomyślnie! Możesz zamknąć to okno.');
        res.sendFile(path.join(__dirname, '../../public/html/twitch_form.html'));

    } catch (error) {
        console.error(`${LOG_PREFIX} Error during code exchange:`, error);
        res.status(500).send('Wystąpił błąd podczas uzyskiwania tokenu');
    }
})


authRouter.post('/set-twitch-username', async (req, res) => {
    const twitchUsername = req.body.twitchUsername;

    if (!twitchUsername) {
        return res.status(400).send('Brak nazwy użytkownika Twitch');
    }

    try {
        await validateTwitchAuth();
        await fetchTwitchUserId(twitchUsername, TWITCH_BOT_OAUTH_TOKEN, CLIENT_ID);
        await fetchTwitchStreamId(getTwitchUserId(), TWITCH_BOT_OAUTH_TOKEN, CLIENT_ID);
        startWebSocketClient(twitchUsername);
        connectAwsWebSocket(twitchUsername)


        res.send('WebSocket client started for user: ' + twitchUsername);
    } catch (error) {
        console.error(`${LOG_PREFIX} starting WebSocket client:`, error);
        res.status(500).send('Błąd podczas uruchamiania klienta WebSocket');
    }
});

