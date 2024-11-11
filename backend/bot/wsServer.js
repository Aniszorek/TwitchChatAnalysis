import {WebSocketServer, WebSocket} from 'ws';

const frontendClients = new Set();
const LOG_PREFIX = 'BACKEND WS:'

export const initWebSocketServer = (server) => {
    const wss = new WebSocketServer({ server });

    wss.on('connection', (ws) => {
        console.log(`${LOG_PREFIX} Frontend client connected`);
        frontendClients.add(ws);

        ws.on('message', (message) => {
            console.log(`${LOG_PREFIX} Received message from frontend:`, message);
        });

        ws.on('close', () => {
            console.log(`${LOG_PREFIX} Frontend client disconnected`);
            frontendClients.delete(ws);
        });
    });

    return wss;
};

export const broadcastMessageToFrontend = (message) => {
    frontendClients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
};
