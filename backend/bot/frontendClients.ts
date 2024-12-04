import {WebSocket} from "ws";
import {METADATA_SEND_INTERVAL, postMetadataToApiGateway} from "../aws/apiGateway";
import {clearInterval} from "node:timers";
import {LogColor, logger} from "../utilities/logger";

const LOG_PREFIX = 'FRONTEND_CLIENTS'

export interface CognitoData {
    cognitoIdToken: string | null;
    cognitoUsername: string | null;
}

export interface TwitchStreamMetadata {
    title: string | undefined ;
    category: string | undefined ;
    viewerCount: number | undefined;
    followersCount: number | undefined;
    subscriberCount: number | undefined;
    messageCount: number | undefined;
    positiveMessageCount: number| undefined;
    negativeMessageCount: number | undefined;
    neutralMessageCount: number | undefined;
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

export interface UserConnections {
    ws: WebSocket;
    twitchWs: WebSocket | null;
    awsWs: WebSocket | null;
    subscriptions: Set<string>;
    cognito: CognitoData;
    twitchData: TwitchData;
    postStreamMetadataIntervalId: NodeJS.Timeout | undefined;
}

// TODO TCA-83 might be moved somewhere more related to sentiment analysis and AWS
export enum SentimentLabel {
    POSITIVE,
    NEGATIVE,
    NEUTRAL
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
    }
    else
    {
        throw Error(`${LOG_PREFIX} invalid cognitoUserId: ${cognitoUserId}`);
    }

};


export const getFrontendClientTwitchStreamMetadata = (cognitoUserId: string ) : TwitchStreamMetadata | undefined => {
    const client = frontendClients.get(cognitoUserId)
    if(client)
    {
        return client.twitchData.streamMetadata
    }
    else
    {
        throw Error(`${LOG_PREFIX} invalid cognitoUserId: ${cognitoUserId}`);
    }
}

export const setFrontendClientTwitchStreamMetadata = (cognitoUserId: string, metadata: TwitchStreamMetadata) => {
    const client = frontendClients.get(cognitoUserId)
    if(client)
    {
        client.twitchData.streamMetadata = metadata
    }
    else
    {
        throw Error(`${LOG_PREFIX} invalid cognitoUserId: ${cognitoUserId}`);
    }
}

export const incrementMessageCount = (cognitoUserId: string)=> {
    const client = frontendClients.get(cognitoUserId)
    if(client){
        if(client.twitchData.streamMetadata.messageCount)
            client.twitchData.streamMetadata.messageCount += 1
        else
            client.twitchData.streamMetadata.messageCount = 1
    }
    else
    {
        throw Error(`${LOG_PREFIX} invalid cognitoUserId: ${cognitoUserId}`);
    }
}

export const incrementSentimentMessageCount = (cognitoUserId: string, label: SentimentLabel)=> {
    const client = frontendClients.get(cognitoUserId)
    if(client){
        switch (label) {
            case SentimentLabel.POSITIVE:
                incrementPositiveCount(client)
                break
            case SentimentLabel.NEGATIVE:
                incrementNegativeCount(client)
                break
            case SentimentLabel.NEUTRAL:
                incrementNeutralCount(client)
                break
        }
    }
    else
    {
        throw Error(`${LOG_PREFIX} invalid cognitoUserId: ${cognitoUserId}`);
    }
}

const incrementPositiveCount = (client: UserConnections) => {
    if(client.twitchData.streamMetadata.positiveMessageCount)
        client.twitchData.streamMetadata.positiveMessageCount += 1
    else
        client.twitchData.streamMetadata.positiveMessageCount = 1
}

const incrementNegativeCount = (client: UserConnections) => {
    if(client.twitchData.streamMetadata.negativeMessageCount)
        client.twitchData.streamMetadata.negativeMessageCount += 1
    else
        client.twitchData.streamMetadata.negativeMessageCount = 1
}

const incrementNeutralCount = (client: UserConnections) => {
    if(client.twitchData.streamMetadata.neutralMessageCount)
        client.twitchData.streamMetadata.neutralMessageCount += 1
    else
        client.twitchData.streamMetadata.neutralMessageCount = 1
}

export const incrementFollowersCount = (cognitoUserId: string)=> {
    const client = frontendClients.get(cognitoUserId)
    if(client){
        if(client.twitchData.streamMetadata.followersCount)
            client.twitchData.streamMetadata.followersCount += 1
        else
            client.twitchData.streamMetadata.followersCount = 1
    }
    else
    {
        throw Error(`${LOG_PREFIX} invalid cognitoUserId: ${cognitoUserId}`);
    }
}

export const incrementSubscriberCount = (cognitoUserId: string)=> {
    const client = frontendClients.get(cognitoUserId)
    if(client){
        if(client.twitchData.streamMetadata.subscriberCount)
            client.twitchData.streamMetadata.subscriberCount += 1
        else
            client.twitchData.streamMetadata.subscriberCount = 1
    }
    else
    {
        throw Error(`${LOG_PREFIX} invalid cognitoUserId: ${cognitoUserId}`);
    }
}

export const createPostStreamMetadataInterval = (cognitoUserId: string ) => {
    const client = frontendClients.get(cognitoUserId)
    if(client)
    {
        client.postStreamMetadataIntervalId = setInterval(async () => {
            try {
                await postMetadataToApiGateway(cognitoUserId)
            } catch (error: any) {
                logger.error(`error with post interval for ${cognitoUserId}: ${error.message}`, LOG_PREFIX);
            }
        }, METADATA_SEND_INTERVAL)
        logger.info(`successfully created post-stream-metadata-interval for ${cognitoUserId}`, LOG_PREFIX, {color: LogColor.WHITE});
    }
    else
    {
        throw Error(`${LOG_PREFIX} invalid cognitoUserId: ${cognitoUserId}`);
    }
}

export const deletePostStreamMetadataInterval = (cognitoUserId: string ) => {
    const client = frontendClients.get(cognitoUserId)
    if(client)
    {
        if(client.postStreamMetadataIntervalId)
        {
            clearInterval(client.postStreamMetadataIntervalId)
            logger.info(`successfully deleted post-stream-metadata-interval for ${cognitoUserId}`, LOG_PREFIX, {color: LogColor.WHITE})
        }
    }
    else
    {
        throw Error(`${LOG_PREFIX} invalid cognitoUserId: ${cognitoUserId}`);
    }
}

export const refreshStreamMetadataCounters = (cognitoUserId: string ) => {
    const client = frontendClients.get(cognitoUserId)
    if(client){
        client.twitchData.streamMetadata.viewerCount = 0
        client.twitchData.streamMetadata.followersCount = 0
        client.twitchData.streamMetadata.subscriberCount = 0
        client.twitchData.streamMetadata.messageCount = 0
        client.twitchData.streamMetadata.positiveMessageCount = 0
        client.twitchData.streamMetadata.negativeMessageCount = 0
        client.twitchData.streamMetadata.neutralMessageCount = 0
    }
    else
    {
        throw Error(`${LOG_PREFIX} invalid cognitoUserId: ${cognitoUserId}`);
    }
}

export const setStreamDataStartValues = (cognitoUserId: string, startedAt: string, startFollows:number, startSubs:number) => {
    const client = frontendClients.get(cognitoUserId);
    if (client) {
        client.twitchData.streamData.startedAt = startedAt
        client.twitchData.streamData.startSubs = startSubs
        client.twitchData.streamData.startFollows = startFollows
    }
    else
    {
        throw Error(`${LOG_PREFIX} invalid cognitoUserId: ${cognitoUserId}`);
    }

};

export const setStreamDataEndValues = (cognitoUserId: string, endedAt: string, endFollows:number, endSubs:number) => {
    const client = frontendClients.get(cognitoUserId);
    if (client) {
        client.twitchData.streamData.endedAt = endedAt
        client.twitchData.streamData.endSubs = endSubs
        client.twitchData.streamData.endFollows = endFollows
    }
    else
    {
        throw Error(`${LOG_PREFIX} invalid cognitoUserId: ${cognitoUserId}`);
    }

};