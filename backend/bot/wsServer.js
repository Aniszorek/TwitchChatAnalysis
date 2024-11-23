import {WebSocketServer, WebSocket} from 'ws';
import {verifyToken} from "../aws/cognitoAuth.js";

const frontendClients = new Map();
const LOG_PREFIX = 'BACKEND WS:'

export const initWebSocketServer = (server) => {
    const wss = new WebSocketServer({ server });

    wss.on('connection', (ws) => {
        console.log(`${LOG_PREFIX} Frontend client connected`);
        let userId = null;

        ws.on('message', async (message) => {
            try {
                const parsedMessage = JSON.parse(message);

                if (parsedMessage.type === 'auth' && parsedMessage["cognitoIdToken"]) {
                    const decodedToken = await verifyToken(parsedMessage["cognitoIdToken"]);
                    userId = decodedToken.sub;
                    frontendClients.set(userId, ws);
                    console.log(`${LOG_PREFIX} WebSocket authenticated for user ID: ${userId}`);
                }
            } catch (err) {
                console.error(`${LOG_PREFIX} Error processing message:`, err);
                ws.close();
            }
        });

        ws.on('close', () => {
            console.log(`${LOG_PREFIX} Frontend client disconnected`);
            if (userId) {
                frontendClients.delete(userId);
            }
        });
    });



    return wss;
};

// export const broadcastMessageToFrontend = (message) => {
//     frontendClients.forEach((client) => {
//         if (client.readyState === WebSocket.OPEN) {
//             client.send(JSON.stringify(message));
//         }
//     });
// };

export const sendMessageToFrontendClient = (userId, message) => {
    const client = frontendClients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
    } else {
        console.log(`${LOG_PREFIX} WebSocket for user ID ${userId} is not available`);
    }
};
