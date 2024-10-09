import express from 'express';
import open from 'open';

import {generateAuthUrl} from './aws/cognitoAuth.js';
import {authRouter} from "./routes/authorization/awsAuthorization.js";


// Express HTTP server
const app = express();
const port = 3000;

// Declare routers here
app.use("/", authRouter);

// Run Express server
app.listen(port, () => {
    console.log(`Serwer Express uruchomiony na porcie ${port}`);
});

// Run Twitch Bot
(async () => {
    try {
        const authUrl = generateAuthUrl();
        console.log(`Otwieranie URL do autoryzacji: ${authUrl}`);
        await open(authUrl);

    } catch (error) {
        console.error('Błąd podczas logowania:', error);
        process.exit(1);
    }
})();