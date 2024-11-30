import express, {Express} from 'express';
import cors from 'cors';
import {authRouter} from "./routes/authorization/awsAuthorization";
import * as http from "node:http";
import {initWebSocketServer} from "./bot/wsServer";

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

const server = http.createServer(app);

initWebSocketServer(server);

server.listen(port, () => {
    console.log(`${LOG_PREFIX} Express server started on: ${port}`);
});
