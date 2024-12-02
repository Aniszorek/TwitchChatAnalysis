import {WebSocket} from "ws";

export interface CognitoData {
    cognitoIdToken: string | null;
    cognitoUsername: string | null;
}

export interface TwitchStreamMetadata {
    title: string | undefined ;
    startedAt: string | undefined;
    category: string | undefined ;
    viewerCount: number | undefined;
    followersCount: number | undefined;
    subscriberCount: number | undefined;
    messageCount: number | undefined;
    positiveMessageCount: number| undefined;
    negativeMessageCount: number | undefined;
    neutralMessageCount: number | undefined;
}


export interface TwitchData {
    twitchBroadcasterUsername: string | null;
    twitchBroadcasterUserId: string | null;
    twitchRole: string | null;
    streamId: string | null;
    streamMetadata: TwitchStreamMetadata;
}

export interface UserConnections {
    ws: WebSocket;
    twitchWs: WebSocket | null;
    awsWs: WebSocket | null;
    subscriptions: Set<string>;
    cognito: CognitoData;
    twitchData: TwitchData;
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
    const userData = frontendClients.get(cognitoUserId);
    if (userData) {
        userData.twitchData.streamId = streamId;
    }
};


export const getFrontendClientTwitchStreamMetadata = (cognitoUserId: string ) : TwitchStreamMetadata | undefined => {
    const client = frontendClients.get(cognitoUserId)
    if(client)
    {
        return client.twitchData.streamMetadata
    }
    return undefined
}

export const setFrontendClientTwitchStreamMetadata = (cognitoUserId: string, metadata: TwitchStreamMetadata) => {
    const client = frontendClients.get(cognitoUserId)
    if(client)
    {
        client.twitchData.streamMetadata = metadata
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
