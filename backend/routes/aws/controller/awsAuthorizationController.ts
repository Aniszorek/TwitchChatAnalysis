import express from "express";
import {TCASecured} from "../../../utilities/TCASecuredDecorator";
import {exchangeCodeForToken, generateAuthUrl, refreshIdToken, verifyToken} from "../../../aws/cognitoAuth";
import {LogColor, logger} from "../../../utilities/logger";
import {handleWebSocketClose, pendingWebSocketInitializations} from "../../../bot/wsServer";
import {frontendClients} from "../../../bot/frontendClients";
import {waitForWebSocketClose} from "../../../utilities/utilities";
import {validateUserRole} from "../../../api_gateway_calls/twitchChatAnalytics-authorization/validateUserRole";
import {CLIENT_ID, TWITCH_BOT_OAUTH_TOKEN} from "../../../envConfig";
import {isSetTwitchUsernamePayload} from "../model/setTwitchUsernamePayload";
import {isRefreshCognitoTokenPayload} from "../model/refreshCognitoTokenPayload";
import {isVerifyCognitoPayload} from "../model/verifyCognitoPayload";
import {CognitoIdTokenData} from "../model/validateUserRoleResponse";
import jwt from "jsonwebtoken";
import {ValidateUserRolePayload} from "../model/validateUserRolePayload";
import {isCognitoRoleValid} from "../../../utilities/cognitoRoles";
import {IS_DEBUG_ENABLED} from "../../../entryPoint";
import {twitchAuthController} from "../../twitch/controller/twitchAuthController";

const LOG_PREFIX = "AWS_AUTHORIZATION_CONTROLLER"



class AwsAuthorizationController {

    // for internal use only
    public async authorizeRole(twitch_oauth_token: string, broadcaster_user_login: string, client_id: string, cognitoIdToken: string) {

        try {
            const decoded: CognitoIdTokenData | null = jwt.decode(cognitoIdToken) as CognitoIdTokenData | null;
            if (!decoded?.["cognito:username"]) {
                logger.error(`Invalid Cognito token ${cognitoIdToken}`, LOG_PREFIX);
                return undefined;
            }
            const username = decoded["cognito:username"];

            const requestBody:ValidateUserRolePayload = {
                oauth_token: twitch_oauth_token,
                cognito_username: username,
                broadcaster_user_login: broadcaster_user_login,
                client_id: client_id
            }
            const headers = {
                authorization: cognitoIdToken,
                broadcasteruserlogin: broadcaster_user_login
            }


            const response =  await validateUserRole(requestBody, headers)

            if (!isCognitoRoleValid(response.body.role)) {
                logger.error(`Unknown role: ${response.body.role} - Status: ${IS_DEBUG_ENABLED ? JSON.stringify(response.body, null ,2) : ""}`, LOG_PREFIX);
                return undefined;
            }
            logger.info(
                `Data sent to API Gateway: ${broadcaster_user_login} ${username}. Response: ${IS_DEBUG_ENABLED ? JSON.stringify(response.body, null, 2) : ""}`,
                LOG_PREFIX)
            return {role: response.body.role, cognitoUsername: username};
        } catch (error:any) {
            logger.error(`Error with cognito role authorization: ${IS_DEBUG_ENABLED ? JSON.stringify(error, null, 2): ""}`, LOG_PREFIX);

        }


    }

    @TCASecured({
        skipAuthorization: true,
        actionDescription: "redirect authorization"
    })
    public async redirectAuthorization(req: express.Request, res: express.Response) {
        const authUrl = generateAuthUrl();
        logger.info(`Redirecting to authUrl`, LOG_PREFIX, {color: LogColor.YELLOW})
        res.redirect(authUrl);
    }

    @TCASecured({
        skipAuthorization: true,
        actionDescription: "redirect auth callback",
        requiredQueryParams: ["code"],
    })
    public async authorizationCallback(req: express.Request, res: express.Response, next: express.NextFunction, context: any) {
        const {queryParams} = context
        const code = queryParams.code;

        if (!code) {
            return res.status(400).send('No authorization code :(');
        }

        // after successful login:
        try {
            const tokenResponse = await exchangeCodeForToken(code);
            const idToken = tokenResponse['id_token'];
            const refreshToken = tokenResponse['refresh_token'];
            const expireTime = Date.now() + tokenResponse['expires_in'] * 1000

            const redirectUrl = `http://localhost:4200/auth-callback?successful=true&idToken=${idToken}&refreshToken=${refreshToken}&expireTime=${expireTime}`;
            logger.info(`Redirecting with tokens`, LOG_PREFIX, {color: LogColor.YELLOW});
            res.redirect(redirectUrl);
        } catch (error: any) {
            logger.error(`Error during token exchange: ${error.message}`, LOG_PREFIX);
            res.redirect('http://localhost:4200/auth-callback?successful=false');
        }
    }

    @TCASecured({
        skipAuthorization: true,
        actionDescription: "setTwitchUsername",
        requiredHeaders: ["authorization"],
        bodyValidationFn: isSetTwitchUsernamePayload
    })
    public async setTwitchUsername(req: express.Request, res: express.Response, next: express.NextFunction, context: any) {
        const {headers, validatedBody} = context;
        const authHeader = headers.authorization;
        const cognitoIdToken = authHeader.split(' ')[1];
        const twitchBroadcasterUsername = validatedBody.twitchBroadcasterUsername

        try {
            await twitchAuthController.validateTwitchAuth();
            const cognitoUserId =  (await verifyToken(cognitoIdToken)).sub
            const userData = frontendClients.get(cognitoUserId!);
            if (userData) {
                logger.info(`Removing previous cognito user connections for id ${cognitoUserId}`, LOG_PREFIX);
                await waitForWebSocketClose(userData.ws, () => handleWebSocketClose(cognitoUserId!));
            }

            // Check if streamer exists
            const result = await twitchAuthController.verifyTwitchUsernameAndStreamStatus(twitchBroadcasterUsername);
            if (!result.success) {
                return res.status(404).send({message: result.message});
            }

            // Validate role for user
            // todo move .toLowerCase to separate variable and use it everywhere (especially in pendingWebSocketInitializations)
            const roleResponse = await awsAuthorizationController.authorizeRole(TWITCH_BOT_OAUTH_TOKEN, twitchBroadcasterUsername.toLowerCase(), CLIENT_ID, cognitoIdToken);

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
        } catch (error: any) {
            logger.error(`Error during setTwitchUsername: ${error.message}`, LOG_PREFIX);
            res.status(500).send('Error during setTwitchUsername');
        }
    }

    @TCASecured({
        skipAuthorization: true,
        actionDescription: "refresh cognito token",
        requiredHeaders: ["authorization"],
        bodyValidationFn: isRefreshCognitoTokenPayload
    })
    public async refreshCognitoToken(req: express.Request, res: express.Response, next: express.NextFunction, context: any) {
        logger.info('refreshing tokens', LOG_PREFIX, {color: LogColor.YELLOW})
        const {validatedBody} = context
        const refreshToken = validatedBody.refreshToken;

        try{
            const data = await refreshIdToken(refreshToken);
            const decodedToken = await verifyToken(data.id_token);
            const userId = decodedToken.sub!;

            // refreshing the token will start as soon as frontend client logs in - meaning that it might not be in the frontend clients
            const userData = frontendClients.get(userId);
            if (userData){
                userData.cognito.cognitoIdToken = data.id_token
            }
            res.status(200).send(data)

        } catch (e: any) {
            logger.error(`Error during refresh token: ${e.message}`, LOG_PREFIX);
            res.status(500).send('Error refreshing token');
        }
    }

    @TCASecured({
        skipAuthorization: true,
        actionDescription: "verify cognito",
        bodyValidationFn: isVerifyCognitoPayload
    })
    public async verifyCognito(req: express.Request, res: express.Response, next: express.NextFunction, context: any) {
        try {
            const {validatedBody} = context
            const idToken = validatedBody.idToken

            await verifyToken(idToken);

            res.status(200).json({
                message: "verified",
                idToken
            });
        } catch (e: any) {
            logger.error(`Error during verify idToken: ${e.message}`, LOG_PREFIX );
            res.status(401).json({message: 'idToken not verified', error: e.message});
        }
    }

}

export const awsAuthorizationController = new AwsAuthorizationController()