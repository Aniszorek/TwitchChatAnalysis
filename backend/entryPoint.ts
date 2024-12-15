import express from 'express';
import cors from 'cors';
import {authRouter} from "./routes/authorization/awsAuthorization";
import * as http from "node:http";
import {initWebSocketServer} from "./bot/wsServer";
import {initializeTwitchApiClient} from "./twitch_calls/twitchApiConfig";
import {twitchUsersRouter} from "./routes/twitch/twitchUsersRouter";
import {CLIENT_ID} from "./envConfig";
import {twitchChannelsRouter} from "./routes/twitch/twitchChannelsRouter";
import {logger, LogLevel} from "./utilities/logger";
import {initializeApiGatewayClient} from "./api_gateway_calls/apiGatewayConfig";
import {awsRouter} from "./routes/aws/awsRouter";
import {twitchModerationRouter} from "./routes/twitch/twitchModerationRouter";
import {twitchChatRouter} from "./routes/twitch/twitchChatRouter";
import {twitchSearchRouter} from "./routes/twitch/twitchSearchRouter";

// INFO > WARN > ERROR
// DEBUG LOGS CONSIDERED SEPARATELY WITH IS_DEBUG_ENABLED
export const LOG_LEVEL = LogLevel.INFO
export const IS_DEBUG_ENABLED = true

const LOG_PREFIX = `ENTRYPOINT`;

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
app.use("/twitch/channels", twitchChannelsRouter);
app.use("/twitch/moderation",twitchModerationRouter)
app.use("/twitch/chat", twitchChatRouter)
app.use("/twitch/search", twitchSearchRouter)

app.use('/aws', awsRouter)

const server = http.createServer(app);

initWebSocketServer(server);
// todo [TCA-27] (https://twitchchatanalysis.atlassian.net/browse/TCA-27) Jak dane będą przychodzić w innym momencie niż na start apki, to będziemy musieli przenieść inicjalizację
initializeTwitchApiClient(TWITCH_BOT_OAUTH_TOKEN, CLIENT_ID)
initializeApiGatewayClient()

server.listen(port, () => {
    logger.info(`Express server started on: ${port}`, LOG_PREFIX)
});
