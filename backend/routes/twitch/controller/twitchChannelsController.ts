import {TCASecured} from "../../../utilities/TCASecuredDecorator";
import express from "express";
import {getChannelFollowersCount} from "../../../twitch_calls/twitchChannels/getChannelFollowers";
import {LogColor, logger, LogStyle} from "../../../utilities/logger";
import {getChannelVips} from "../../../twitch_calls/twitchChannels/getChannelVips";
import {postAddVip} from "../../../twitch_calls/twitchChannels/vipUser";
import {deleteVipUser} from "../../../twitch_calls/twitchChannels/unvipUser";
import {isPostCreatePollPayload, postCreatePoll} from "../../../twitch_calls/twitchChannels/postCreatePoll";
import {postStartRaid} from "../../../twitch_calls/twitchChannels/postStartRaid";
import {deleteCancelRaid} from "../../../twitch_calls/twitchChannels/deleteCancelRaid";
import {
    isPatchChannelInformationPayload,
    patchChannelInformation
} from "../../../twitch_calls/twitchChannels/patchChannelInformation";
import {COGNITO_ROLES} from "../../../utilities/CognitoRoleEnum";
import {getChannelInformation} from "../../../twitch_calls/twitchChannels/getChannelInformation";

const LOG_PREFIX = 'TWITCH_CHANNEL_CONTROLLER';

class TwitchChannelController {

    @TCASecured({
        requiredQueryParams: ["broadcaster_id"],
        requiredHeaders: ["x-twitch-oauth-token"],
        requiredRole: COGNITO_ROLES.STREAMER,
        actionDescription: "Get Channel Followers"
    })
    public async getFollowers(req: express.Request, res: express.Response, next: express.NextFunction, context: any) {
        const { queryParams, headers, validatedBody } = context;
        try {
            const result = await getChannelFollowersCount(queryParams, headers);
            logger.info("Successfully get followers count", LOG_PREFIX, { color: LogColor.MAGENTA, style: LogStyle.DIM });
            res.json(result);
        } catch (error: any) {
            logger.error(`Error in /followers route: ${error.message}. ${error.response.data.message}`, LOG_PREFIX);
            res.status(error.response.status).json({
                error: `Failed to fetch channel followers users: ${error.response.data.message}`,
            });
        }
    }

    @TCASecured({
        requiredQueryParams: ["broadcaster_id"],
        requiredHeaders: ["x-twitch-oauth-token"],
        requiredRole: COGNITO_ROLES.STREAMER,
        actionDescription: "Get Channel VIPs"
    })
    public async getVips(req: express.Request, res: express.Response, next: express.NextFunction, context: any) {
        const { queryParams, headers, validatedBody } = context;
        try {
            const result = await getChannelVips(queryParams, headers);
            logger.info(`Successfully get vips for broadcaster_id: ${queryParams.broadcaster_id}`, LOG_PREFIX, {
                color: LogColor.MAGENTA,
                style: LogStyle.DIM,
            });

            res.json(result);
        } catch (error: any) {
            logger.error(`Error in /vips route: ${error.message}. ${error.response.data.message}`, LOG_PREFIX);
            res.status(error.response.status).json({
                error: `Failed to fetch channel vip users: ${error.response.data.message}`,
            });
        }
    }

    @TCASecured({
        requiredQueryParams: ["broadcaster_id", "user_id"],
        requiredHeaders: ["x-twitch-oauth-token"],
        requiredRole: COGNITO_ROLES.STREAMER,
        actionDescription: "Add VIP",
    })
    public async addVip(req: express.Request, res: express.Response, next: express.NextFunction, context: any) {
        const { queryParams, headers, validatedBody } = context;
        try {
            const result = await postAddVip(queryParams, headers);
            logger.info(`Successfully added VIP with user_id: ${queryParams.user_id}`, LOG_PREFIX, {
                color: LogColor.MAGENTA,
                style: LogStyle.DIM,
            });
            res.json(result);
        } catch (error: any) {
            logger.error(`Error in post /vips route: ${error.message}. ${error.response.data.message}`, LOG_PREFIX);
            res.status(error.response.status).json({
                error: `Failed to add VIP: ${error.response.data.message}`,
            });
        }
    }

    @TCASecured({
        requiredQueryParams: ["broadcaster_id", "user_id"],
        requiredHeaders: ["x-twitch-oauth-token"],
        requiredRole: COGNITO_ROLES.STREAMER,
        actionDescription: "Delete VIP"
    })
    public async deleteVip(req: express.Request, res: express.Response, next: express.NextFunction, context: any) {
        const { queryParams, headers, validatedBody } = context;
        try {
            const result = await deleteVipUser(queryParams, headers);
            logger.info(`Successfully deleted VIP with user_id: ${queryParams.user_id}`, LOG_PREFIX, {
                color: LogColor.MAGENTA,
                style: LogStyle.DIM,
            });
            res.json(result);
        } catch (error: any) {
            logger.error(`Error in delete /vips route: ${error.message}. ${error.response.data.message}`, LOG_PREFIX);
            res.status(error.response.status).json({
                error: `Failed to delete VIP: ${error.response.data.message}`,
            });
        }
    }

    @TCASecured({
        requiredRole: COGNITO_ROLES.STREAMER,
        requiredHeaders: ["x-twitch-oauth-token"],
        actionDescription: "Create Poll",
        bodyValidationFn: isPostCreatePollPayload
    })
    public async createPoll(req: express.Request, res: express.Response, next: express.NextFunction, context: any) {
        const { queryParams, headers, validatedBody } = context;
        try {
            const result = await postCreatePoll(validatedBody, headers); // Using validatedBody from context
            logger.info(`Successfully started a poll`, LOG_PREFIX, { color: LogColor.MAGENTA, style: LogStyle.DIM });
            res.json(result);
        } catch (error: any) {
            logger.error(`Error in post /polls route: ${error.message}. ${error.response.data.message}`, LOG_PREFIX);
            res.status(error.response.status).json({
                error: `Failed to create a poll: ${error.response.data.message}`,
            });
        }
    }

    @TCASecured({
        requiredQueryParams: ["from_broadcaster_id", "to_broadcaster_id"],
        requiredHeaders: ["x-twitch-oauth-token"],
        requiredRole: COGNITO_ROLES.STREAMER,
        actionDescription: "Start Raid"
    })
    public async startRaid(req: express.Request, res: express.Response, next: express.NextFunction, context: any) {
        const { queryParams, headers, validatedBody } = context;
        try {
            const result = await postStartRaid(queryParams, headers);
            logger.info(`Successfully started a raid to: ${queryParams.to_broadcaster_id}`, LOG_PREFIX, {
                color: LogColor.MAGENTA,
                style: LogStyle.DIM,
            });
            res.json(result);
        } catch (error: any) {
            logger.error(`Error in post /raids route: ${error.message}. ${error.response.data.message}`, LOG_PREFIX);
            res.status(error.response.status).json({
                error: `Failed to create a raid: ${error.response.data.message}`,
            });
        }
    }

    @TCASecured({
        requiredQueryParams: ["broadcaster_id"],
        requiredHeaders: ["x-twitch-oauth-token"],
        requiredRole: COGNITO_ROLES.STREAMER,
        actionDescription: "Cancel Raid"
    })
    public async cancelRaid(req: express.Request, res: express.Response, next: express.NextFunction, context: any) {
        const { queryParams, headers, validatedBody } = context;
        try {
            const result = await deleteCancelRaid(queryParams, headers);
            logger.info(`Successfully cancelled a raid`, LOG_PREFIX, { color: LogColor.MAGENTA, style: LogStyle.DIM });
            res.json(result);
        } catch (error: any) {
            logger.error(`Error in delete /raids route: ${error.message}. ${error.response.data.message}`, LOG_PREFIX);
            res.status(error.response.status).json({
                error: `Failed to cancel a raid: ${error.response.data.message}`,
            });
        }
    }

    @TCASecured({
        requiredQueryParams: ["broadcaster_id"],
        requiredHeaders: ["x-twitch-oauth-token"],
        requiredRole: COGNITO_ROLES.STREAMER,
        bodyValidationFn: isPatchChannelInformationPayload,
        actionDescription: "Patch Channel Information"
    })
    public async patchChannelInfo(
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
        context: { queryParams: any, headers: any, validatedBody: any }
    ) {
        const { queryParams, headers, validatedBody } = context;
        try {
            const result = await patchChannelInformation(queryParams, validatedBody, headers); // Using validatedBody
            logger.info(`Successfully patched Channel Information`, LOG_PREFIX, { color: LogColor.MAGENTA, style: LogStyle.DIM });
            res.json(result);
        } catch (error: any) {
            logger.error(`Error in patch / route: ${error.message}. ${error.response.data.message}`, LOG_PREFIX);
            res.status(error.response.status).json({
                error: `Failed to patch Channel Information: ${error.response.data.message}`,
            });
        }
    }

    @TCASecured({
        requiredQueryParams: ["broadcaster_id"],
        requiredHeaders: ["x-twitch-oauth-token"],
        requiredRole: COGNITO_ROLES.VIEWER,
        actionDescription: "Get Channel Information"
    })
    public async getChannelInfo(
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
        context: { queryParams: any, headers: any, validatedBody: any }
    )
    {
        const { queryParams, headers, validatedBody } = context;
        try{
            const result = await getChannelInformation(queryParams, headers);
            logger.info(`Successfully got Channel Information`, LOG_PREFIX, { color: LogColor.MAGENTA, style: LogStyle.DIM });
            res.json(result);
        }
        catch (error: any) {
            logger.error(`Error in get / route: ${error.message}. ${error.response.data.message}`, LOG_PREFIX);
            res.status(error.response.status).json({
                error: `Failed to get Channel Information: ${error.response.data.message}`,
            });
        }
    }
}

export const twitchChannelController = new TwitchChannelController();