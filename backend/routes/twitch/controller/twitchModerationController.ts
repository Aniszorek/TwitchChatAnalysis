import {NextFunction, Request, Response} from "express";
import {LogColor, logger, LogStyle} from "../../../utilities/logger";
import {getChannelModerators} from "../../../twitch_calls/twitchModeration/getModerators";
import {postBanUser} from "../../../twitch_calls/twitchModeration/banUser";
import {deleteBanUser} from "../../../twitch_calls/twitchModeration/unbanUser";
import {postAddModerator} from "../../../twitch_calls/twitchModeration/modUser";
import {deleteModerator} from "../../../twitch_calls/twitchModeration/unmodUser";
import {deleteMessage} from "../../../twitch_calls/twitchModeration/deleteMessage";
import {getAutomodSettings} from "../../../twitch_calls/twitchModeration/getAutomodSettings";
import {putAutomodSettings} from "../../../twitch_calls/twitchModeration/putAutomodSettings";
import {getBlockedTerms} from "../../../twitch_calls/twitchModeration/getBlockedTerms";
import {postBlockedTerm} from "../../../twitch_calls/twitchModeration/postBlockedTerm";
import {deleteBlockedTerm} from "../../../twitch_calls/twitchModeration/deleteBlockedTerm";
import {TCASecured} from "../../../utilities/TCASecuredDecorator";
import {COGNITO_ROLES} from "../../../utilities/CognitoRoleEnum";
import {isBanUserPayload} from "../model/postBanUserPayload";
import {isPutAutomodSettingsPayload} from "../model/putAutomodSettingsPayload";
import {isPostBlockedTermPayload} from "../model/postBlockedTermPayload";

const LOG_PREFIX = "TWITCH_MODERATION_CONTROLLER";

export class TwitchModerationController {

    @TCASecured({
        requiredQueryParams: ["broadcaster_id"],
        requiredHeaders: ["x-twitch-oauth-token"],
        requiredRole: COGNITO_ROLES.STREAMER,
        actionDescription: "Get Channel Moderators"
    })
    public async getModerators(req: Request, res: Response, next: NextFunction, context: any) {
        const {queryParams, headers } = context;
        try {
            const result = await getChannelModerators(queryParams, headers);
            logger.info(`Successfully fetched moderators for broadcaster_id: ${queryParams.broadcaster_id}`, LOG_PREFIX, { color: LogColor.MAGENTA, style: LogStyle.DIM });
            res.json(result);
        } catch (error: any) {
            logger.error(`Error in get /moderators route: ${error.message}. ${error.response.data.message}`, LOG_PREFIX);
            res.status(error.response.status).json({ error: `Failed to fetch moderators: ${error.response.data.message}` });
        }
    }

    @TCASecured({
        bodyValidationFn: isBanUserPayload,
        requiredHeaders: ["x-twitch-oauth-token"],
        requiredRole: COGNITO_ROLES.MODERATOR,
        actionDescription: "Ban User"
    })
    public async banUser(req: Request, res: Response, next: NextFunction, context: any) {
        const {headers, validatedBody} = context;
        try {
            const result = await postBanUser(validatedBody, headers);
            logger.info(`Successfully banned user with ID: ${validatedBody.data.user_id}`, LOG_PREFIX, { color: LogColor.MAGENTA, style: LogStyle.DIM });
            res.json(result);
        } catch (error: any) {
            logger.error(`Error in post /bans route: ${error.message}. ${error.response.data.message}`, LOG_PREFIX);
            res.status(error.response.status).json({ error: `Failed to ban user: ${error.response.data.message}` });
        }
    }

    @TCASecured({
        requiredQueryParams: ["broadcaster_id", "user_id", "moderator_id"],
        requiredHeaders: ["x-twitch-oauth-token"],
        requiredRole: COGNITO_ROLES.MODERATOR,
        actionDescription: "Unban User"
    })
    public async unbanUser(req: Request, res: Response, next: NextFunction, context: any) {
        const {queryParams, headers} = context;
        try {
            const result = await deleteBanUser(queryParams, headers);
            logger.info(`Successfully unbanned user`, LOG_PREFIX, { color: LogColor.MAGENTA, style: LogStyle.DIM });
            res.json(result);
        } catch (error: any) {
            logger.error(`Error in delete /bans route: ${error.message}. ${error.response.data.message}`, LOG_PREFIX);
            res.status(error.response.status).json({ error: `Failed to unban user: ${error.response.data.message}` });
        }
    }

    @TCASecured({
        requiredQueryParams: ["broadcaster_id", "user_id"],
        requiredHeaders: ["x-twitch-oauth-token"],
        requiredRole: COGNITO_ROLES.STREAMER,
        actionDescription: "Add Moderator"
    })
    public async addModerator(req: Request, res: Response, next: NextFunction, context: any) {
        const {queryParams, headers} = context;
        try {
            const result = await postAddModerator(queryParams, headers);
            logger.info(`Successfully added moderator with user_id: ${queryParams.user_id}`, LOG_PREFIX, { color: LogColor.MAGENTA, style: LogStyle.DIM });
            res.json(result);
        } catch (error: any) {
            logger.error(`Error in post /moderators route: ${error.message}. ${error.response.data.message}`, LOG_PREFIX);
            res.status(error.response.status).json({ error: `Failed to add moderator: ${error.response.data.message}` });
        }
    }

    @TCASecured({
        requiredQueryParams: ["broadcaster_id", "user_id"],
        requiredHeaders: ["x-twitch-oauth-token"],
        requiredRole: COGNITO_ROLES.STREAMER,
        actionDescription: "Remove Moderator"
    })
    public async removeModerator(req: Request, res: Response, next: NextFunction, context: any) {
        const {queryParams, headers} = context;
        try {
            const result = await deleteModerator(queryParams, headers);
            logger.info(`Successfully removed moderator with user_id: ${queryParams.user_id}`, LOG_PREFIX, { color: LogColor.MAGENTA, style: LogStyle.DIM });
            res.json(result);
        } catch (error: any) {
            logger.error(`Error in delete /moderators route: ${error.message}. ${error.response.data.message}`, LOG_PREFIX);
            res.status(error.response.status).json({ error: `Failed to remove moderator: ${error.response.data.message}` });
        }
    }

    @TCASecured({
        requiredQueryParams: ["broadcaster_id", "moderator_id", "message_id"],
        requiredHeaders: ["x-twitch-oauth-token"],
        requiredRole: COGNITO_ROLES.MODERATOR,
        actionDescription: "Delete Chat Message"
    })
    public async deleteMessage(req: Request, res: Response, next: NextFunction, context: any) {
        const {queryParams, headers} = context;
        try {
            const result = await deleteMessage(queryParams, headers);
            logger.info(`Successfully deleted message with id: ${queryParams.message_id}`, LOG_PREFIX, { color: LogColor.MAGENTA, style: LogStyle.DIM });
            res.json(result);
        } catch (error: any) {
            logger.error(`Error in delete /chat route: ${error.message}. ${error.response.data.message}`, LOG_PREFIX);
            res.status(error.response.status).json({ error: `Failed to delete chat message: ${error.response.data.message}` });
        }
    }

    @TCASecured({
        requiredQueryParams: ["broadcaster_id", "moderator_id"],
        requiredHeaders: ["x-twitch-oauth-token"],
        requiredRole: COGNITO_ROLES.MODERATOR,
        actionDescription: "Get Automod Settings"
    })
    public async getAutomodSettings(req: Request, res: Response, next: NextFunction, context: any) {
        const {queryParams, headers} = context;
        try {
            const result = await getAutomodSettings(queryParams, headers);
            logger.info(`Successfully fetched automod settings`, LOG_PREFIX, { color: LogColor.MAGENTA, style: LogStyle.DIM });
            res.json(result);
        } catch (error: any) {
            logger.error(`Error in get /automod/settings route: ${error.message}. ${error.response.data.message}`, LOG_PREFIX);
            res.status(error.response.status).json({ error: `Failed to get automod settings: ${error.response.data.message}` });
        }
    }

    @TCASecured({
        requiredQueryParams: ["broadcaster_id", "moderator_id"],
        requiredHeaders: ["x-twitch-oauth-token"],
        bodyValidationFn: isPutAutomodSettingsPayload,
        requiredRole: COGNITO_ROLES.MODERATOR,
        actionDescription: "Put Automod Settings"
    })
    public async putAutomodSettings(req: Request, res: Response, next: NextFunction, context: any) {
        const {queryParams, headers, validatedBody} = context;
        try {
            const result = await putAutomodSettings(queryParams, validatedBody, headers);
            logger.info(`Successfully updated automod settings`, LOG_PREFIX, { color: LogColor.MAGENTA, style: LogStyle.DIM });
            res.json(result);
        } catch (error: any) {
            logger.error(`Error in put /automod/settings route: ${error.message}. ${error.response.data.message}`, LOG_PREFIX);
            res.status(error.response.status).json({ error: `Failed to update automod settings: ${error.response.data.message}` });
        }
    }

    @TCASecured({
        requiredQueryParams: ["broadcaster_id", "moderator_id"],
        requiredHeaders: ["x-twitch-oauth-token"],
        requiredRole: COGNITO_ROLES.MODERATOR,
        actionDescription: "Get Blocked Terms"
    })
    public async getBlockedTerms(req: Request, res: Response, next: NextFunction, context: any) {
        const {queryParams, headers} = context;
        try {
            const result = await getBlockedTerms(queryParams, headers);
            logger.info(`Successfully fetched blocked terms`, LOG_PREFIX, { color: LogColor.MAGENTA, style: LogStyle.DIM });
            res.json(result);
        } catch (error: any) {
            logger.error(`Error in get /blocked_terms route: ${error.message}. ${error.response.data.message}`, LOG_PREFIX);
            res.status(error.response.status).json({ error: `Failed to get blocked terms: ${error.response.data.message}` });
        }
    }

    @TCASecured({
        requiredQueryParams: ["broadcaster_id", "moderator_id"],
        requiredHeaders: ["x-twitch-oauth-token"],
        bodyValidationFn: isPostBlockedTermPayload,
        requiredRole: COGNITO_ROLES.MODERATOR,
        actionDescription: "Add Blocked Term"
    })
    public async addBlockedTerm(req: Request, res: Response, next: NextFunction, context: any) {
        const {queryParams, headers, validatedBody} = context;
        try {
            const result = await postBlockedTerm(queryParams, validatedBody, headers);
            logger.info(`Successfully added blocked term`, LOG_PREFIX, { color: LogColor.MAGENTA, style: LogStyle.DIM });
            res.json(result);
        } catch (error: any) {
            logger.error(`Error in post /blocked_terms route: ${error.message}. ${error.response.data.message}`, LOG_PREFIX);
            res.status(error.response.status).json({ error: `Failed to add blocked term: ${error.response.data.message}` });
        }
    }

    @TCASecured({
        requiredQueryParams: ["broadcaster_id", "moderator_id", "id"],
        requiredHeaders: ["x-twitch-oauth-token"],
        requiredRole: COGNITO_ROLES.MODERATOR,
        actionDescription: "Delete Blocked Term"
    })
    public async deleteBlockedTerm(req: Request, res: Response, next: NextFunction, context: any) {
        const {queryParams, headers} = context;
        try {
            const result = await deleteBlockedTerm(queryParams, headers);
            logger.info(`Successfully deleted blocked term`, LOG_PREFIX, { color: LogColor.MAGENTA, style: LogStyle.DIM });
            res.json(result);
        } catch (error: any) {
            logger.error(`Error in delete /blocked_terms route: ${error.message}. ${error.response.data.message}`, LOG_PREFIX);
            res.status(error.response.status).json({ error: `Failed to delete blocked term: ${error.response.data.message}` });
        }
    }
}

export const twitchModerationController = new TwitchModerationController()

