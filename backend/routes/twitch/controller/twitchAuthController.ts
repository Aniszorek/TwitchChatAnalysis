import {validateTwitchAuth} from "../../../twitch_calls/twitch/twitchAuth";
import {LogColor, logger} from "../../../utilities/logger";
import {FetchTwitchStreamData} from "../model/fetchTwitchStreamDataResponse";
import {VerifyTwitchUsernameAndStreamStatusResponse} from "../model/verifyTwitchUsernameAndStreamStatusResponse";
import {twitchUsersController} from "./twitchUsersController";
import {twitchStreamsController} from "./twitchStreamsController";

const LOG_PREFIX = 'TWITCH_AUTH_CONTROLLER';

class TwitchAuthController {

    // for internal use only
    public async validateTwitchAuth(twitchOauthToken: string) {
        try {
            const headers = {
                Authorization: `OAuth ${twitchOauthToken}`,
            }

            const response = await validateTwitchAuth(headers)
            logger.info(`Validated token.`, LOG_PREFIX, {color: LogColor.MAGENTA_BRIGHT});
        } catch (error: any) {
            logger.error(`Error validating token: ${error.message}`, LOG_PREFIX);
        }
    }

    // for internal use only
    public async verifyTwitchUsernameAndStreamStatus(twitchUsername: string, twitchOauthToken: string):Promise<VerifyTwitchUsernameAndStreamStatusResponse> {
        const fetchResponse = await twitchUsersController.fetchTwitchUserIdByNickname(twitchUsername, twitchOauthToken);

        if (!fetchResponse.found) {
            return {success: false, message: `Streamer with username: ${twitchUsername} not found`};
        }

        const broadcasterId = fetchResponse.userId!;

        const streamStatus: FetchTwitchStreamData = await twitchStreamsController.fetchTwitchStreamMetadata(broadcasterId, twitchOauthToken);
        return {success: true, message: "Twitch username validated and authorized", streamStatus, userId: broadcasterId};
    }
}

export const twitchAuthController = new TwitchAuthController();
