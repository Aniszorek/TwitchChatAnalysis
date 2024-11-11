import express from 'express';
import cors from 'cors';

import {authRouter} from "./routes/authorization/awsAuthorization.js";
import * as http from "node:http";
import {initWebSocketServer} from "./bot/wsServer.js";

const LOG_PREFIX= `ENTRYPOINT:`

// Express HTTP server
const app = express();
const port = 3000;


// Middleware & static files
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:4200', // Angular app
    credentials: true,
}));  // Needed for testing on local setup (since both frontend and backend are running on localhost)

// Declare routers here
app.use("/", authRouter);


const server = http.createServer(app);
initWebSocketServer(server);

server.listen(port, () => {
    console.log(`${LOG_PREFIX} Express server started on: ${port}`);
});
