import express from 'express';
import open from 'open';
import cors from 'cors';

import {generateAuthUrl} from './aws/cognitoAuth.js';
import {authRouter} from "./routes/authorization/awsAuthorization.js";

const LOG_PREFIX= `ENTRYPOINT:`

// Express HTTP server
const app = express();
const port = 3000;


// Middleware & static files
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cors());  // Needed for testing on local setup (since both frontend and backend are running on localhost)

// Declare routers here
app.use("/", authRouter);


// Run Express server
app.listen(port, () => {
    console.log(`${LOG_PREFIX} Express server started on: ${port}`);
});

// Run Twitch Bot
(async () => {
    try {
        const authUrl = generateAuthUrl();
        console.log(`${LOG_PREFIX} Cognito Auth URL: ${authUrl}`);
        await open(authUrl);

    } catch (error) {
        console.error(`${LOG_PREFIX} Login error:`, error);
        process.exit(1);
    }
})();