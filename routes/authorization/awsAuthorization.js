import express from 'express';

import {validateTwitchAuth, startWebSocketClient} from '../../bot/bot.js';
import {exchangeCodeForToken} from '../../aws/cognitoAuth.js';


export const authRouter = express.Router();

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
        res.send('Logowanie zakończone pomyślnie! Możesz zamknąć to okno.');

        // Uruchom WebSocket po autoryzacji
        await validateTwitchAuth();
        startWebSocketClient();

    } catch (error) {
        console.error('Błąd podczas wymiany kodu:', error);
        res.status(500).send('Wystąpił błąd podczas uzyskiwania tokenu');
    }
})
