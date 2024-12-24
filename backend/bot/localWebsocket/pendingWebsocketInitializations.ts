export interface PendingWebSocketInitialization {
    twitchOauthToken: string;
    twitchBroadcasterUsername: string;
    twitchBroadcasterUserId: string;
    twitchRole: string;
    streamId: string;
    streamTitle?: string;
    streamCategory?: string;
    streamStartedAt?: string;
    streamViewerCount?: number;
    cognitoUsername: string;
    cognitoIdToken: string;
}

export const pendingWebSocketInitializations = new Map<string, PendingWebSocketInitialization>();

