import express from 'express';

import {
    exchangeCodeForToken,
    generateAuthUrl,
    refreshIdTokenIfExpiredAndNotConnectedToFE,
    verifyToken
} from '../../aws/cognitoAuth.js';
import {
    CLIENT_ID, TWITCH_BOT_OAUTH_TOKEN, verifyTwitchUsernameAndStreamStatus
} from '../../bot/bot.js';
import {validateTwitchAuth,} from '../../api_calls/twitchApiCalls.js';
import {validateUserRole} from "../../aws/apiGateway.js";
import {pendingWebSocketInitializations} from "../../bot/wsServer.js";


const LOG_PREFIX = `ROUTE_AWS_AUTHORIZATION:`;

export const authRouter = express.Router();

authRouter.get('/auth-url', (req, res) => {
    const authUrl = generateAuthUrl();
    console.log(`${LOG_PREFIX} Redirecting to authUrl`)
    res.redirect(authUrl);
})


authRouter.get('/callback', async (req, res) => {
    const {code} = req.query;

    if (!code) {
        return res.status(400).send('Brak kodu autoryzacyjnego');
    }

    // after successful login:
    try {
        const tokenResponse = await exchangeCodeForToken(code);
        const idToken = tokenResponse['id_token'];
        const refreshToken = tokenResponse['refresh_token'];
        const expireTime = Date.now() + tokenResponse['expires_in'] * 1000

        const redirectUrl = `http://localhost:4200/auth-callback?successful=true&idToken=${idToken}&refreshToken=${refreshToken}&expireTime=${expireTime}`;
        console.log(`${LOG_PREFIX} Redirecting with tokens`);
        res.redirect(redirectUrl);
    } catch (error) {
        console.error(`${LOG_PREFIX} Error during token exchange:`, error);
        res.redirect('http://localhost:4200/auth-callback?successful=false');
    }
})


authRouter.post('/set-twitch-username', async (req, res) => {
    // todo: add cognito token verification
    let cognitoIdToken = req.body["cognitoIdToken"];
    const cognitoRefreshToken = req.body["cognitoRefreshToken"];
    let cognitoTokenExpiryTime = req.body["cognitoTokenExpiryTime"];
    const twitchBroadcasterUsername = req.body["twitchUsername"].toLowerCase();

    if (!twitchBroadcasterUsername) {
        return res.status(400).send('Twitch username is missing');
    }

    try {
        // sub is a part of jwt, and it can be used as identifier for Cognito user
        // we will use it to determine to which websocket connection messages should be forwarded
        const cognitoUserId = (await verifyToken(cognitoIdToken)).sub
        await validateTwitchAuth();

        // Connect to Twitch Websocket API
        const result = await verifyTwitchUsernameAndStreamStatus(twitchBroadcasterUsername);
        if (!result.success) {
            return res.status(404).send({message: result.message});
        }

        // cannot use refreshIdTokenIfExpired, because that function assumes that this client exists in frontendClients
        // which is not in this case
        const {newIdToken, newExpiryTime} = await refreshIdTokenIfExpiredAndNotConnectedToFE(cognitoRefreshToken, cognitoTokenExpiryTime, twitchBroadcasterUsername);

        if(newIdToken && newExpiryTime) {
            cognitoIdToken = newIdToken
            cognitoTokenExpiryTime = newExpiryTime
        }

        // Validate role for user
        const roleResponse = await validateUserRole(TWITCH_BOT_OAUTH_TOKEN, twitchBroadcasterUsername, CLIENT_ID, cognitoIdToken)

        if(!roleResponse) {
            return res.status(500).send({message: 'Could not resolve role for this twitch account'});
        }

        const streamId = result.streamStatus.stream_id
        const twitchBroadcasterUserId = result.userId
        const twitchRole = roleResponse.role
        const cognitoUsername = roleResponse.cognitoUsername

        pendingWebSocketInitializations.set(cognitoUserId, {
            twitchBroadcasterUsername,
            twitchBroadcasterUserId,
            twitchRole,
            streamId,
            cognitoUsername,
            cognitoIdToken,
            cognitoRefreshToken,
            cognitoTokenExpiryTime
        });

        res.send({ message: 'Streamer found and WebSocket connections can now be initialized' });
    } catch (error) {
        console.error(`${LOG_PREFIX}  Error during Twitch/AWS setup:`, error);
        res.status(500).send('Error validating Twitch user and credentials');
    }
});


authRouter.post('/verify-cognito', async (req, res) => {
    try{
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).send('idToken is required');
        }

        await verifyToken(idToken);

        res.status(200).json({
            message: "verified",
            idToken
        });
    }
    catch (e){
        console.error(`${LOG_PREFIX} Error during verify idToken:`, e.message);
        res.status(401).json({message: 'idToken not verified', error: e.message});
    }
})