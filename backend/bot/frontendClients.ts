import {WebSocket} from "ws";
import {clearInterval} from "node:timers";
import {LogColor, logger} from "../utilities/logger";
import {METADATA_SEND_INTERVAL} from "../api_gateway_calls/stream-metadata/postStreamMetadata";
import {awsStreamMetadataController} from "../routes/aws/controller/awsStreamMetadataController";

const LOG_PREFIX = 'FRONTEND_CLIENTS'

export interface CognitoData {
    cognitoIdToken: string | null;
    cognitoUsername: string | null;
}

export interface TwitchStreamMetadata {
    title: string | undefined;
    category: string | undefined;
    viewerCount: number | undefined;
    followersCount: number | undefined;
    subscriberCount: number | undefined;
    messageCount: number | undefined;
    veryNegativeMessageCount: number | undefined;
    negativeMessageCount: number | undefined;
    slightlyNegativeMessageCount: number | undefined;
    neutralMessageCount: number | undefined;
    slightlyPositiveMessageCount: number | undefined;
    positiveMessageCount: number | undefined;
    veryPositiveMessageCount: number | undefined;
}

export interface StreamData {
    startedAt: string | undefined;
    startFollows: number | undefined;
    startSubs: number | undefined;
    endedAt: string | undefined;
    endFollows: number | undefined;
    endSubs: number | undefined;
}

export interface TwitchData {
    twitchBroadcasterUsername: string | null;
    twitchBroadcasterUserId: string | null;
    twitchRole: string | null;
    streamId: string | null;
    streamMetadata: TwitchStreamMetadata;
    streamData: StreamData;
}

interface ReadinessState {
    twitchReady: boolean;
    awsReady: boolean;
}

export interface UserConnections {
    ws: WebSocket;
    twitchWs: WebSocket | null;
    awsWs: WebSocket | null;
    subscriptions: Set<string>;
    cognito: CognitoData;
    twitchData: TwitchData;
    postStreamMetadataIntervalId: NodeJS.Timeout | undefined;
    readiness: ReadinessState;
}

export enum SentimentLabel {
    VERY_NEGATIVE = "Very Negative",
    NEGATIVE = "Negative",
    SLIGHTLY_NEGATIVE = "Slightly Negative",
    NEUTRAL = "Neutral",
    SLIGHTLY_POSITIVE = "Slightly Positive",
    POSITIVE = "Positive",
    VERY_POSITIVE = "Very Positive"
}

export const frontendClients = new Map<string, UserConnections>();

export const setFrontendClientCognitoData = (
    cognitoUserId: string,
    cognitoIdToken: string | null,
    cognitoUsername: string | null
) => {
    const userData = frontendClients.get(cognitoUserId);
    if (!userData) return;

    if (cognitoIdToken) userData.cognito.cognitoIdToken = cognitoIdToken;
    if (cognitoUsername) userData.cognito.cognitoUsername = cognitoUsername;

}


export const setFrontendClientTwitchData = (
    cognitoUserId: string,
    twitchBroadcasterUsername: string,
    twitchBroadcasterUserId: string,
    twitchRole: string,
    streamId: string | null
) => {
    const userData = frontendClients.get(cognitoUserId);
    if (!userData) return;

    userData.twitchData.twitchBroadcasterUsername = twitchBroadcasterUsername;
    userData.twitchData.twitchBroadcasterUserId = twitchBroadcasterUserId;
    userData.twitchData.twitchRole = twitchRole;
    setFrontendClientTwitchDataStreamId(cognitoUserId, streamId);
}


export const setFrontendClientTwitchDataStreamId = (cognitoUserId: string, streamId: string | null) => {
    const client = frontendClients.get(cognitoUserId);
    if (client) {
        client.twitchData.streamId = streamId;
    } else {
        throw Error(`${LOG_PREFIX} invalid cognitoUserId: ${cognitoUserId}`);
    }

};


export const getFrontendClientTwitchStreamMetadata = (cognitoUserId: string): TwitchStreamMetadata | undefined => {
    const client = frontendClients.get(cognitoUserId)
    if (client) {
        return client.twitchData.streamMetadata
    } else {
        throw Error(`${LOG_PREFIX} invalid cognitoUserId: ${cognitoUserId}`);
    }
}

export const setFrontendClientTwitchStreamMetadata = (cognitoUserId: string, metadata: TwitchStreamMetadata) => {
    const client = frontendClients.get(cognitoUserId)
    if (client) {
        client.twitchData.streamMetadata = metadata
    } else {
        throw Error(`${LOG_PREFIX} invalid cognitoUserId: ${cognitoUserId}`);
    }
}

export const incrementMessageCount = (cognitoUserId: string) => {
    const client = frontendClients.get(cognitoUserId)
    if (client) {
        if (client.twitchData.streamMetadata.messageCount)
            client.twitchData.streamMetadata.messageCount += 1
        else
            client.twitchData.streamMetadata.messageCount = 1
    } else {
        throw Error(`${LOG_PREFIX} invalid cognitoUserId: ${cognitoUserId}`);
    }
}

export const incrementSentimentMessageCount = (cognitoUserId: string, label: SentimentLabel) => {
    const client = frontendClients.get(cognitoUserId)
    if (client) {
        switch (label) {
            case SentimentLabel.VERY_NEGATIVE:
                incrementVeryNegativeCount(client)
                break
            case SentimentLabel.NEGATIVE:
                incrementNegativeCount(client)
                break
            case SentimentLabel.SLIGHTLY_NEGATIVE:
                incrementSlightlyNegativeCount(client)
                break
            case SentimentLabel.NEUTRAL:
                incrementNeutralCount(client)
                break
            case SentimentLabel.SLIGHTLY_POSITIVE:
                incrementSlightlyPositiveCount(client)
                break
            case SentimentLabel.POSITIVE:
                incrementPositiveCount(client)
                break
            case SentimentLabel.VERY_POSITIVE:
                incrementVeryPositiveCount(client)
                break
        }
    } else {
        throw Error(`${LOG_PREFIX} invalid cognitoUserId: ${cognitoUserId}`);
    }
}

const incrementVeryNegativeCount = (client: UserConnections) => {
    if (client.twitchData.streamMetadata.veryNegativeMessageCount)
        client.twitchData.streamMetadata.veryNegativeMessageCount += 1
    else
        client.twitchData.streamMetadata.veryNegativeMessageCount = 1
}

const incrementNegativeCount = (client: UserConnections) => {
    if (client.twitchData.streamMetadata.negativeMessageCount)
        client.twitchData.streamMetadata.negativeMessageCount += 1
    else
        client.twitchData.streamMetadata.negativeMessageCount = 1
}

const incrementSlightlyNegativeCount = (client: UserConnections) => {
    if (client.twitchData.streamMetadata.slightlyNegativeMessageCount)
        client.twitchData.streamMetadata.slightlyNegativeMessageCount += 1
    else
        client.twitchData.streamMetadata.slightlyNegativeMessageCount = 1
}

const incrementNeutralCount = (client: UserConnections) => {
    if (client.twitchData.streamMetadata.neutralMessageCount)
        client.twitchData.streamMetadata.neutralMessageCount += 1
    else
        client.twitchData.streamMetadata.neutralMessageCount = 1
}

const incrementSlightlyPositiveCount = (client: UserConnections) => {
    if (client.twitchData.streamMetadata.slightlyPositiveMessageCount)
        client.twitchData.streamMetadata.slightlyPositiveMessageCount += 1
    else
        client.twitchData.streamMetadata.slightlyPositiveMessageCount = 1
}

const incrementPositiveCount = (client: UserConnections) => {
    if (client.twitchData.streamMetadata.positiveMessageCount)
        client.twitchData.streamMetadata.positiveMessageCount += 1
    else
        client.twitchData.streamMetadata.positiveMessageCount = 1
}

const incrementVeryPositiveCount = (client: UserConnections) => {
    if (client.twitchData.streamMetadata.veryPositiveMessageCount)
        client.twitchData.streamMetadata.veryPositiveMessageCount += 1
    else
        client.twitchData.streamMetadata.veryPositiveMessageCount = 1
}

export const incrementFollowersCount = (cognitoUserId: string) => {
    const client = frontendClients.get(cognitoUserId)
    if (client) {
        if (client.twitchData.streamMetadata.followersCount)
            client.twitchData.streamMetadata.followersCount += 1
        else
            client.twitchData.streamMetadata.followersCount = 1
    } else {
        throw Error(`${LOG_PREFIX} invalid cognitoUserId: ${cognitoUserId}`);
    }
}

export const incrementSubscriberCount = (cognitoUserId: string) => {
    const client = frontendClients.get(cognitoUserId)
    if (client) {
        if (client.twitchData.streamMetadata.subscriberCount)
            client.twitchData.streamMetadata.subscriberCount += 1
        else
            client.twitchData.streamMetadata.subscriberCount = 1
    } else {
        throw Error(`${LOG_PREFIX} invalid cognitoUserId: ${cognitoUserId}`);
    }
}

export const createPostStreamMetadataInterval = (cognitoUserId: string) => {
    const client = frontendClients.get(cognitoUserId)
    if (client) {
        client.postStreamMetadataIntervalId = setInterval(async () => {
            try {
                await awsStreamMetadataController.postStreamMetadata(cognitoUserId)
            } catch (error: any) {
                logger.error(`error with post interval for ${cognitoUserId}: ${error.message}`, LOG_PREFIX);
            }
        }, METADATA_SEND_INTERVAL)
        logger.info(`successfully created post-stream-metadata-interval for ${cognitoUserId}`, LOG_PREFIX, {color: LogColor.WHITE});
    } else {
        throw Error(`${LOG_PREFIX} invalid cognitoUserId: ${cognitoUserId}`);
    }
}

export const deletePostStreamMetadataInterval = (cognitoUserId: string) => {
    const client = frontendClients.get(cognitoUserId)
    if (client) {
        if (client.postStreamMetadataIntervalId) {
            clearInterval(client.postStreamMetadataIntervalId)
            logger.info(`successfully deleted post-stream-metadata-interval for ${cognitoUserId}`, LOG_PREFIX, {color: LogColor.WHITE})
        }
    } else {
        throw Error(`${LOG_PREFIX} invalid cognitoUserId: ${cognitoUserId}`);
    }
}

export const refreshStreamMetadataCounters = (cognitoUserId: string) => {
    const client = frontendClients.get(cognitoUserId)
    if (client) {
        client.twitchData.streamMetadata.viewerCount = 0
        client.twitchData.streamMetadata.followersCount = 0
        client.twitchData.streamMetadata.subscriberCount = 0
        client.twitchData.streamMetadata.messageCount = 0
        client.twitchData.streamMetadata.positiveMessageCount = 0
        client.twitchData.streamMetadata.slightlyPositiveMessageCount = 0
        client.twitchData.streamMetadata.veryPositiveMessageCount = 0
        client.twitchData.streamMetadata.negativeMessageCount = 0
        client.twitchData.streamMetadata.slightlyNegativeMessageCount = 0
        client.twitchData.streamMetadata.veryNegativeMessageCount = 0
        client.twitchData.streamMetadata.neutralMessageCount = 0
    } else {
        throw Error(`${LOG_PREFIX} invalid cognitoUserId: ${cognitoUserId}`);
    }
}

export const setStreamDataStartValues = (cognitoUserId: string, startedAt: string, startFollows: number, startSubs: number) => {
    const client = frontendClients.get(cognitoUserId);
    if (client) {
        client.twitchData.streamData.startedAt = startedAt
        client.twitchData.streamData.startSubs = startSubs
        client.twitchData.streamData.startFollows = startFollows
    } else {
        throw Error(`${LOG_PREFIX} invalid cognitoUserId: ${cognitoUserId}`);
    }

};

export const setStreamDataEndValues = (cognitoUserId: string, endedAt: string, endFollows: number, endSubs: number) => {
    const client = frontendClients.get(cognitoUserId);
    if (client) {
        client.twitchData.streamData.endedAt = endedAt
        client.twitchData.streamData.endSubs = endSubs
        client.twitchData.streamData.endFollows = endFollows
    } else {
        throw Error(`${LOG_PREFIX} invalid cognitoUserId: ${cognitoUserId}`);
    }

};

export const getClientAndCognitoIdToken = (cognitoUserId: string) => {
    const client = frontendClients.get(cognitoUserId);

    if (!client) {
        throw Error(`${LOG_PREFIX} client not found for cognitoUserId: ${cognitoUserId}`)
    }

    const cognitoIdToken = client.cognito?.cognitoIdToken;

    if (!cognitoIdToken) {
        throw Error(`${LOG_PREFIX} Cognito token missing in wsServer for user: ${cognitoUserId}`)

    }

    return {client, cognitoIdToken}
}