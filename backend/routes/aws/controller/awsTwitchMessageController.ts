import {TCASecured} from "../../../utilities/TCASecuredDecorator";
import express from "express";
import {LogColor, logger, LogStyle} from "../../../utilities/logger";
import {IS_DEBUG_ENABLED} from "../../../entryPoint";
import {getTwitchMessageFromApiGateway,} from "../../../api_gateway_calls/twitch-message/getTwitchMessage";
import {GetTwitchMessageResponse, TwitchMessageData} from "../model/getTwitchMessageResponse";
import {ErrorWithStatus} from "../../../utilities/ErrorWithStatus";
import {getClientAndCognitoIdToken} from "../../../websocket/frontendClients";
import {TwitchMessage} from "../model/twitchMessage";
import {PostTwitchMessagePayload} from "../model/postTwitchMessagePayload";
import {postMessageToApiGateway} from "../../../api_gateway_calls/twitch-message/postTwitchMessage";
import {COGNITO_ROLES} from "../../../utilities/CognitoRoleEnum";

const LOG_PREFIX = "AWS_TWITCH_MESSAGE_CONTROLLER"

class AwsTwitchMessageController {

    @TCASecured({
        requiredQueryParams: ["chatter_user_login"],
        optionalQueryParams: ["stream_id", "start_time", "end_time"],
        requiredHeaders: ["authorization", "broadcasteruserlogin", "x-twitch-oauth-token"],
        requiredRole: COGNITO_ROLES.MODERATOR,
        actionDescription: "Get TwitchMessages"
    })
    public async getTwitchMessages(req: express.Request, res: express.Response, next: express.NextFunction, context: any) {
        const {queryParams, optionalQueryParams, headers, cognitoUserId} = context;
        try{
            const result = await getTwitchMessageFromApiGateway({...queryParams, ...optionalQueryParams}, headers);

            const response = await AwsTwitchMessageController.buildResponse(
                result,
                queryParams.chatter_user_login,
            );

            logger.info("Successfully get twitch messages", LOG_PREFIX, { color: LogColor.YELLOW, style: LogStyle.DIM });
            res.status(200).json(response);
        }
        catch (error: any) {

            if(error instanceof ErrorWithStatus)
            {
                logger.error(`Error in get /twitch-messages: ${error}. ${IS_DEBUG_ENABLED ? JSON.stringify(error.message, null, 2) : ""}`, LOG_PREFIX);
                res.status(error.status).json({
                    error: `Failed to fetch twitch messages: ${JSON.stringify(error.message)}`,
                });
            }
            else {
                logger.error(`Error in get /twitch-messages: ${error}. ${IS_DEBUG_ENABLED ? JSON.stringify(error.response, null, 2) : ""}`, LOG_PREFIX);
                res.status(error.response.status).json({
                    error: `Failed to fetch twitch messages: ${JSON.stringify(error.response.data)}`,
                });
            }
        }
    }

    private static async buildResponse(
        messages: TwitchMessageData[],
        chatterUserLogin: string,
    ): Promise<GetTwitchMessageResponse> {
        return {chatter_user_login: chatterUserLogin, messages};
    }

    // for internal use only
    public async postTwitchMessage (msg: TwitchMessage, cognitoUserId: string) {
        try {

            const {client, cognitoIdToken} = getClientAndCognitoIdToken(cognitoUserId)
            if (!cognitoIdToken) {
                logger.error(`Cognito token missing for user: ${cognitoUserId}`, LOG_PREFIX);
                return;
            }

            const streamId = client.twitchData?.streamId;

            const payload: PostTwitchMessagePayload = {
                chatter_user_login: msg.chatterUserLogin,
                chatter_user_id: msg.chatterUserId,
                chatter_user_name: msg.chatterUserName,
                message_text: msg.messageText,
                timestamp: msg.messageTimestamp,
                stream_id: streamId,
                message_id: msg.messageId
            }
            const headers = {
                broadcasteruserlogin: msg.broadcasterUserLogin,
                authorization: 'Bearer ' + cognitoIdToken
            }

            const response = await postMessageToApiGateway(payload, headers)
            logger.info(`Message sent to API Gateway: ${msg.messageText}`, LOG_PREFIX);
            return response
        } catch (error: any) {
            logger.error(`Failed to post twitch messages from API Gateway: ${error.message}`, LOG_PREFIX);
        }
    }

}

export const awsTwitchMessageController = new AwsTwitchMessageController();