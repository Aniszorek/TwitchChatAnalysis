import {FetchTwitchStreamData} from "../model/fetchTwitchStreamDataResponse";
import {LogColor, logger} from "../../../utilities/logger";
import {fetchTwitchStreamMetadata} from "../../../twitch_calls/twitchStreams/fetchTwitchStreamMetadata";
import {frontendClients} from "../../../bot/frontendClients";

const LOG_PREFIX = 'TWITCH_STREAMS_CONTROLLER';

class TwitchStreamsController {
    // for internal use only
    public async fetchTwitchStreamMetadata(userId: string, twitchOauthToken: string): Promise<FetchTwitchStreamData> {
        try {
            const queryParams = { user_id: userId }
            const response = await fetchTwitchStreamMetadata(queryParams, {"x-twitch-oauth-token": twitchOauthToken})

            const streamData = response.data.data[0];

            if (!streamData) {
                logger.info(`Streamer is currently offline`, LOG_PREFIX, {color: LogColor.MAGENTA_BRIGHT});
                return {stream_id: undefined};
            }

            return {
                stream_id: streamData.id,
                title: streamData.title,
                viewer_count: streamData.viewer_count,
                started_at: streamData.started_at,
                category: streamData.game_name
            };
        } catch (error: any) {
            logger.error(`Error fetching Twitch stream data: ${error.message}`, LOG_PREFIX);
            return {stream_id: undefined};
        }
    }
}

export const twitchStreamsController = new TwitchStreamsController();

