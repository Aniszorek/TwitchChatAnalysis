import express, {NextFunction, Request, Response} from 'express';

import {exchangeCodeForToken, generateAuthUrl, verifyToken} from '../../aws/cognitoAuth';
import {verifyTwitchUsernameAndStreamStatus} from '../../bot/bot';
import {pendingWebSocketInitializations} from "../../bot/wsServer";
import {validateTwitchAuth} from "../../twitch_calls/twitchAuth";
import {CLIENT_ID, TWITCH_BOT_OAUTH_TOKEN} from "../../envConfig";
import {validateUserRole} from "../../api_gateway_calls/twitchChatAnalytics-authorization/validateUserRole";


const LOG_PREFIX = `ROUTE_AWS_AUTHORIZATION:`;

interface SetTwitchUsernameRequestBody {
    cognitoIdToken: string;
    twitchBroadcasterUsername: string;
}

export async function verifyTokenMiddleware(req: Request, res: Response, next: NextFunction) {
    const cognitoIdToken = req.headers["x-cognito-id-token"] as string | undefined;

    if (!cognitoIdToken) {
        return res.status(404).send({message: 'Token is missing or invalid'});
    }

    try {
        await verifyToken(cognitoIdToken);
        next();
    } catch (error: any) {
        console.error(`${LOG_PREFIX} Token verification failed: ${error}`);
        res.status(401).json({message: 'Token verification failed', error: error.message});

    }
}

// todo: powinniśmy rozdzielić te endpointy na różne pliki, bo nie każdy służy do autoryzacji
export const authRouter = express.Router();

authRouter.get('/auth-url', (req, res) => {
    const authUrl = generateAuthUrl();
    console.log(`${LOG_PREFIX} Redirecting to authUrl`)
    res.redirect(authUrl);
});


authRouter.get('/callback', async (req, res) => {
    const {code} = req.query;

    if (!code) {
        return res.status(400).send('Brak kodu autoryzacyjnego');
    }

    // after successful login:
    try {
        const tokenResponse = await exchangeCodeForToken(code as string);
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


authRouter.post('/set-twitch-username', verifyTokenMiddleware, async (req, res) => {
    const cognitoIdToken = <string>req.headers["x-cognito-id-token"];

    let {
        twitchBroadcasterUsername
    }: SetTwitchUsernameRequestBody = req.body;


    if (!twitchBroadcasterUsername) {
        return res.status(400).send('Twitch username is missing');
    }

    try {
        // sub is a part of jwt, and it can be used as identifier for Cognito user
        // we will use it to determine to which websocket connection messages should be forwarded
        const cognitoUserId = (await verifyToken(cognitoIdToken)).sub;
        await validateTwitchAuth();

        // Connect to Twitch Websocket API
        const result = await verifyTwitchUsernameAndStreamStatus(twitchBroadcasterUsername);
        if (!result.success) {
            return res.status(404).send({message: result.message});
        }


        // Validate role for user
        // todo move .toLowerCase to separate variable and use it everywhere (especially in pendingWebSocketInitializations)
        const roleResponse = await validateUserRole(TWITCH_BOT_OAUTH_TOKEN, twitchBroadcasterUsername.toLowerCase(), CLIENT_ID, cognitoIdToken);

        if (!roleResponse) {
            return res.status(500).send({message: 'Could not resolve role for this Twitch account'});
        }

        const streamId = result.streamStatus!.stream_id!;
        const twitchBroadcasterUserId = result.userId!;
        const streamTitle = result.streamStatus?.title!;
        const streamCategory = result.streamStatus?.category!;
        const streamStartedAt = result.streamStatus?.started_at!;
        const streamViewerCount = result.streamStatus?.viewer_count!;

        const twitchRole = roleResponse.role;
        const cognitoUsername = roleResponse.cognitoUsername;

        pendingWebSocketInitializations.set(cognitoUserId!, {
            twitchBroadcasterUsername,
            twitchBroadcasterUserId,
            twitchRole,
            streamId,
            streamTitle,
            streamCategory,
            streamStartedAt,
            streamViewerCount,
            cognitoUsername,
            cognitoIdToken,
        });

        res.send({message: 'Streamer found and WebSocket connections can now be initialized'});
    } catch (error) {
        console.error(`${LOG_PREFIX}  Error during Twitch/AWS setup:`, error);
        res.status(500).send('Error validating Twitch user and credentials');
    }
});


authRouter.post('/verify-cognito', async (req, res) => {
    try {
        const {idToken} = req.body;
        if (!idToken) {
            return res.status(400).send('idToken is required');
        }

        await verifyToken(idToken);

        res.status(200).json({
            message: "verified",
            idToken
        });
    } catch (e: any) {
        console.error(`${LOG_PREFIX} Error during verify idToken:`, e.message);
        res.status(401).json({message: 'idToken not verified', error: e.message});
    }
})