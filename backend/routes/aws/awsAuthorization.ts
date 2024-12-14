import express from 'express';
import {createHandlerWithContext} from "../../utilities/utilities";
import {awsAuthorizationController} from "./controller/awsAuthorizationController";

export const authRouter = express.Router();

authRouter.get('/auth-url', createHandlerWithContext(awsAuthorizationController.redirectAuthorization));
authRouter.get('/callback', createHandlerWithContext(awsAuthorizationController.authorizationCallback))
authRouter.post('/set-twitch-username', createHandlerWithContext(awsAuthorizationController.setTwitchUsername));
authRouter.post('/verify-cognito', createHandlerWithContext(awsAuthorizationController.verifyCognito))
authRouter.post('/refresh-cognito-tokens', createHandlerWithContext(awsAuthorizationController.refreshCognitoToken))