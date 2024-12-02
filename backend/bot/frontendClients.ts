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
