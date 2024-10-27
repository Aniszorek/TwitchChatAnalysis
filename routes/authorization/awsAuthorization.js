import express from 'express';

import {validateTwitchAuth, startWebSocketClient, TWITCH_BOT_OAUTH_TOKEN, CLIENT_ID} from '../../bot/bot.js';
import {exchangeCodeForToken} from '../../aws/cognitoAuth.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchTwitchUserId } from '../../api_calls/twitchApiCalls.js';

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
        // Po pomyślnym zalogowaniu wymień kod autoryzancyjny na access token
        const tokenResponse = await exchangeCodeForToken(code);

        console.log('Uzyskano tokeny:', tokenResponse);
        // res.send('Logowanie zakończone pomyślnie! Możesz zamknąć to okno.');
        res.sendFile(path.join(__dirname, '../../public/html/twitch_form.html'));


    } catch (error) {
        console.error('Błąd podczas wymiany kodu:', error);
        res.status(500).send('Wystąpił błąd podczas uzyskiwania tokenu');
    }
})


// awsAuthorization.js
authRouter.post('/set-twitch-username', (req, res) => {
    const twitchUsername = req.body.twitchUsername;

    if (!twitchUsername) {
        return res.status(400).send('Brak nazwy użytkownika Twitch');
    }

    try {
        validateTwitchAuth();
        fetchTwitchUserId(twitchUsername, TWITCH_BOT_OAUTH_TOKEN, CLIENT_ID)
            .then(data => console.log('User Data:', data))
            .catch(error => console.error('Error:', error));

        startWebSocketClient(twitchUsername);

        res.send('WebSocket client started for user: ' + twitchUsername);
    } catch (error) {
        console.error('Error starting WebSocket client:', error);
        res.status(500).send('Błąd podczas uruchamiania klienta WebSocket');
    }
});

