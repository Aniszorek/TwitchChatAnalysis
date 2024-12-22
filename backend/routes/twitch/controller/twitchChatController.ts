import {NextFunction, Request, Response} from 'express';
import {LogColor, logger, LogStyle} from "../../../utilities/logger";
import {postChatMessage} from "../../../twitch_calls/twitchChat/sendChatMessage";
import {IS_DEBUG_ENABLED} from "../../../entryPoint";
import {getChatSettings} from "../../../twitch_calls/twitchChat/getChatSettings";
import {patchChatSettings} from "../../../twitch_calls/twitchChat/patchChatSettings";
import {TCASecured} from "../../../utilities/TCASecuredDecorator";
import {COGNITO_ROLES} from "../../../utilities/CognitoRoleEnum";
import {isPatchChatSettingsPayload} from "../model/patchChatSettingsPayload";
import {isSendChatMessagePayload} from "../model/postSendChatMessagePayload";

const LOG_PREFIX = "TWITCH_CHAT_CONTROLLER";

export class TwitchChatController {

    @TCASecured({
        requiredQueryParams: ['broadcaster_id', 'moderator_id'],
        requiredRole: COGNITO_ROLES.VIEWER,
        requiredHeaders: ["x-twitch-oauth-token"],
        actionDescription: "Get Chat Settings"
    })
    public async getChatSettings(req: Request, res: Response, next: NextFunction, context: any) {
        const {queryParams, headers} = context;
        try {
            const result = await getChatSettings(queryParams, headers);
            logger.info(
                `Successfully fetched chat settings: ${IS_DEBUG_ENABLED ? JSON.stringify(result, null, 2) : ""}`,
                LOG_PREFIX,
                { color: LogColor.MAGENTA, style: LogStyle.DIM }
            );
            res.json(result);
        } catch (error: any) {
            logger.error(`Error in get /settings route: ${error.message}. ${error.response.data.message}`, LOG_PREFIX);
            res.status(error.response.status).json({
                error: `Failed to fetch chat settings: ${error.response.data.message}`,
            });
        }
    }

    @TCASecured({
        requiredQueryParams: ['broadcaster_id', 'moderator_id'],
        requiredHeaders: ["x-twitch-oauth-token"],
        bodyValidationFn: isPatchChatSettingsPayload,
        requiredRole: COGNITO_ROLES.MODERATOR,
        actionDescription: "Patch Chat Settings"
    })
    public async patchChatSettings(req: Request, res: Response, next: NextFunction, context: any) {
        const {queryParams, headers, validatedBody} = context;
        try {
            const result = await patchChatSettings(queryParams, validatedBody, headers);
            logger.info(
                `Successfully patched chat settings: ${IS_DEBUG_ENABLED ? JSON.stringify(result, null, 2) : ""}`,
                LOG_PREFIX,
                { color: LogColor.MAGENTA, style: LogStyle.DIM }
            );
            res.json(result);
        } catch (error: any) {
            logger.error(`Error in patch /settings route: ${error.message}. ${error.response.data.message}`, LOG_PREFIX);
            res.status(error.response.status).json({
                error: `Failed to patch chat settings: ${error.response.data.message}`,
            });
        }
    }

    @TCASecured({
        requiredHeaders: ["x-twitch-oauth-token"],
        bodyValidationFn: isSendChatMessagePayload,
        requiredRole: COGNITO_ROLES.VIEWER,
        actionDescription: "Send Chat Message"
    })
    public async sendChatMessage(req: Request, res: Response, next: NextFunction, context: any) {
        const {headers, validatedBody} = context;
        try {
            const result = await postChatMessage(validatedBody, headers);
            logger.info(
                `Successfully sent chat message: ${IS_DEBUG_ENABLED ? JSON.stringify(result.data, null, 2) : ""}`,
                LOG_PREFIX,
                { color: LogColor.MAGENTA, style: LogStyle.DIM }
            );
            res.json(result);
        } catch (error: any) {
            logger.error(`Error in post /messages route: ${error.message}. ${error.response.data.message}`, LOG_PREFIX);
            res.status(error.response.status).json({
                error: `Failed to send chat message: ${error.response.data.message}`,
            });
        }
    }
}

export const twitchChatController = new TwitchChatController();

