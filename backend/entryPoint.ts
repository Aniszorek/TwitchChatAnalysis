import express from 'express';
import cors from 'cors';
import {authRouter} from "./routes/authorization/awsAuthorization";
import * as http from "node:http";
import {initWebSocketServer} from "./bot/wsServer";
import {initializeTwitchApiClient} from "./twitch_calls/twitchApiConfig";
import {twitchUsersRouter} from "./routes/twitch/twitchUsersRouter";
import {CLIENT_ID, TWITCH_BOT_OAUTH_TOKEN} from "./envConfig";

const LOG_PREFIX = `ENTRYPOINT:`;

const port = 3000;
const app = express();

// Middleware & static files
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:4200', // Angular app
    credentials: true,
})); // Allow local testing with Angular frontend

app.use("/", authRouter);
app.use("/twitch/users", twitchUsersRouter);

const server = http.createServer(app);

initWebSocketServer(server);
// todo [TCA-27] (https://twitchchatanalysis.atlassian.net/browse/TCA-27) Jak dane będą przychodzić w innym momencie niż na start apki, to będziemy musieli przenieść inicjalizację
initializeTwitchApiClient(TWITCH_BOT_OAUTH_TOKEN, CLIENT_ID)
server.listen(port, () => {
    console.log(`${LOG_PREFIX} Express server started on: ${port}`);
});
