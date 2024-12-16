import {WebSocket, WebSocketServer} from 'ws';
import {verifyToken} from "../aws/cognitoAuth";
import {startTwitchWebSocket} from "./bot";
import {connectAwsWebSocket} from "../aws/websocketApi";
import {
    createPostStreamMetadataInterval,
    deletePostStreamMetadataInterval,
    frontendClients,
    setFrontendClientCognitoData,
    setFrontendClientTwitchData,
    setFrontendClientTwitchStreamMetadata,
    setStreamDataEndValues,
    setStreamDataStartValues,
    TwitchStreamMetadata
} from "./frontendClients";
import {getChannelSubscriptionsCount} from "../twitch_calls/twitch/getBroadcastersSubscriptions";
import {getChannelFollowersCount} from "../twitch_calls/twitchChannels/getChannelFollowers";
import {createTimestamp} from "../utilities/utilities";
import {LogBackgroundColor, LogColor, logger, LogStyle} from "../utilities/logger";
import {IS_DEBUG_ENABLED} from "../entryPoint";
import {awsStreamController} from "../routes/aws/controller/awsStreamController";
import {verifyUserPermission} from "../utilities/cognitoRoles";
import {COGNITO_ROLES} from "../utilities/CognitoRoleEnum";
import {twitchEventsubController} from "../routes/twitch/controller/twitchEventsubController";

const LOG_PREFIX = 'BACKEND_WS'

export const pendingWebSocketInitializations = new Map<string, {
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
}>();


export const initWebSocketServer = (server: any): WebSocketServer => {
    const wss = new WebSocketServer({server});

    wss.on('connection', (ws: WebSocket) => {
        logger.info(`Frontend client connected`, LOG_PREFIX, {color: LogColor.CYAN, backgroundColor: LogBackgroundColor.BG_BLACK, style: LogStyle.BOLD});
        let userId: string | null = null;

        ws.on('message', async (message: string) => {
            try {
                const parsedMessage = JSON.parse(message);

                if (parsedMessage.type === 'auth' && parsedMessage["cognitoIdToken"]) {
                    // todo: figure out what if token is not valid (do we care?)
                    const decodedToken = await verifyToken(parsedMessage["cognitoIdToken"]);
                    userId = decodedToken.sub!;

                    frontendClients.set(userId, {
                        ws,
                        twitchWs: null,
                        awsWs: null,
                        subscriptions: new Set(),
                        cognito: {
                            cognitoIdToken: null,
                            cognitoUsername: null,
                        },
                        twitchData: {
                            twitchBroadcasterUsername: null,
                            twitchBroadcasterUserId: null,
                            twitchRole: null,
                            streamId: null,
                            streamMetadata: {
                                title: undefined,
                                category: undefined,
                                viewerCount: 0,
                                followersCount: 0,
                                subscriberCount: 0,
                                messageCount: 0,
                                veryNegativeMessageCount: 0,
                                negativeMessageCount: 0,
                                slightlyNegativeMessageCount: 0,
                                neutralMessageCount: 0,
                                slightlyPositiveMessageCount: 0,
                                positiveMessageCount: 0,
                                veryPositiveMessageCount: 0
                            },
                            streamData:{
                                startedAt: undefined,
                                startFollows: 0,
                                startSubs: 0,
                                endedAt: undefined,
                                endFollows: 0,
                                endSubs: 0
                            }
                        },
                        postStreamMetadataIntervalId: undefined,
                        readiness: {twitchReady: false, awsReady: false},
                    });

                    if (pendingWebSocketInitializations.has(userId)) {
                        const {
                            twitchBroadcasterUsername,
                            twitchBroadcasterUserId,
                            twitchRole,
                            streamId,
                            streamTitle,
                            streamCategory,
                            streamStartedAt,
                            streamViewerCount,
                            cognitoUsername,
                            cognitoIdToken,
                        } = pendingWebSocketInitializations.get(userId)!;

                        const streamMetadata: TwitchStreamMetadata = {
                            title: streamTitle,
                            category: streamCategory,
                            viewerCount: streamViewerCount,
                            followersCount: 0,
                            subscriberCount: 0,
                            messageCount: 0,
                            veryNegativeMessageCount: 0,
                            negativeMessageCount: 0,
                            slightlyNegativeMessageCount: 0,
                            neutralMessageCount: 0,
                            slightlyPositiveMessageCount: 0,
                            positiveMessageCount: 0,
                            veryPositiveMessageCount: 0
                        }

                        setFrontendClientCognitoData(userId, cognitoIdToken, cognitoUsername);
                        setFrontendClientTwitchData(userId, twitchBroadcasterUsername, twitchBroadcasterUserId, twitchRole, streamId);
                        setFrontendClientTwitchStreamMetadata(userId, streamMetadata)

                        if(streamId && verifyUserPermission(userId, COGNITO_ROLES.STREAMER, "create post-stream-metadata-interval"))
                            createPostStreamMetadataInterval(userId)

                        if(streamId && streamStartedAt && verifyUserPermission(userId, COGNITO_ROLES.STREAMER, "get start_subs and start_followers count from Twitch API"))
                        {
                            const subCount = await getChannelSubscriptionsCount({broadcaster_id: twitchBroadcasterUserId})
                            const followerCount = await getChannelFollowersCount({broadcaster_id: twitchBroadcasterUserId})
                            setStreamDataStartValues(userId, streamStartedAt, followerCount, subCount)
                        }

                        if(streamId && verifyUserPermission(userId, COGNITO_ROLES.STREAMER, "send POST /stream to api gateway"))
                        {
                            // sometimes twitch /get-streams endpoint is not ready at the moment of getting this event
                            // so we wait a moment
                            setTimeout(() => {
                                if(userId)
                                    awsStreamController.postStream(userId);
                            }, 3000)
                        }

                        const twitchResult = await startTwitchWebSocket(twitchBroadcasterUsername, userId);
                        if (twitchResult != null) {
                            frontendClients.get(userId)!.twitchWs = twitchResult;
                        } else {
                            logger.error(`Twitch websocket not connected for ${userId}`, LOG_PREFIX);
                        }

                        const awsResult = connectAwsWebSocket(twitchBroadcasterUsername, userId);
                        if (awsResult != null) {
                            frontendClients.get(userId)!.awsWs = awsResult;
                        } else {
                            logger.error(`AWS websocket not connected for ${userId}`, LOG_PREFIX);
                        }

                        pendingWebSocketInitializations.delete(userId);
                    }
                    logger.info(`WebSocket authenticated for user ID: ${userId}`, LOG_PREFIX, {color: LogColor.CYAN, style: LogStyle.BOLD});
                }
            } catch (err: any) {
                logger.error(`Error processing message: ${err.message}`, LOG_PREFIX);
                ws.close();
            }
        });

        ws.on('close', async () => await handleWebSocketClose(userId));

    });

    return wss;
};

async function cleanupUserConnections(userId: string, subscriptions: Set<string>) {
    const userData = frontendClients.get(userId);

    if (userData?.twitchWs && userData.twitchWs.readyState === WebSocket.OPEN) {
        userData.twitchWs.close();
        logger.info(`Closed Twitch WebSocket for user ID: ${userId}`, LOG_PREFIX, {color: LogColor.CYAN});
    }

    if (userData?.awsWs && userData.awsWs.readyState === WebSocket.OPEN) {
        userData.awsWs.close();
        logger.info(`Closed AWS WebSocket for user ID: ${userId}`, LOG_PREFIX, {color: LogColor.CYAN});
    }

    await cleanupSubscriptions(userId, subscriptions);

    if(verifyUserPermission(userId, COGNITO_ROLES.STREAMER, "delete post-stream-metadata-interval"))
        deletePostStreamMetadataInterval(userId)

    if (userData?.ws && userData.ws.readyState === WebSocket.OPEN) {
        userData.ws.close();
        logger.info(`Closed frontend WebSocket for user ID: ${userId}`, LOG_PREFIX, {color: LogColor.CYAN});
    }
}


async function cleanupSubscriptions(userId: string, subscriptions: Set<string>) {
    logger.info(`Cleaning up subscriptions for user ID: ${userId}`, LOG_PREFIX, {color: LogColor.CYAN});

    for (const subscriptionId of subscriptions) {
        try {
            const result = await twitchEventsubController.deleteTwitchSubscription(subscriptionId);
            if (result) {
                subscriptions.delete(subscriptionId);
            }
        } catch (err: any) {
            logger.error(`Failed to delete subscription ${subscriptionId}: ${err.message}`, LOG_PREFIX);
        }
    }
    logger.info(`Cleanup completed for user ID: ${userId}`, LOG_PREFIX, {color: LogColor.CYAN});
}


export function trackSubscription(userId: string, subscriptionId: string) {
    const userData = frontendClients.get(userId);
    if (userData) {
        userData.subscriptions.add(subscriptionId);
        logger.info(`Tracked subscription ${subscriptionId} for user ID: ${userId}`, LOG_PREFIX, {color: LogColor.CYAN});
    } else {
        logger.error(`Attempted to track subscription for nonexistent user ID: ${userId}`, LOG_PREFIX);
    }
}

// todo jaka będzie struktura message?
export const sendMessageToFrontendClient = (userId: string, message: any) => {
    const userData = frontendClients.get(userId);
    if (userData && userData.ws.readyState === WebSocket.OPEN) {
        userData.ws.send(JSON.stringify(message));
        logger.debug(`Data send to FE client: ${IS_DEBUG_ENABLED ? JSON.stringify(message, null, 2) : ""}`, LOG_PREFIX, {color: LogColor.CYAN});
    } else {
        logger.error(`WebSocket for user ID ${userId} is not available`, LOG_PREFIX);
    }
};


export async function handleWebSocketClose(userId: string | null): Promise<void> {
    logger.info(`Frontend client disconnected`, LOG_PREFIX, {
        color: LogColor.CYAN,
        backgroundColor: LogBackgroundColor.BG_BLACK,
        style: LogStyle.BOLD,
    });

    if (!userId) return;

    const userData = frontendClients.get(userId);
    if (!userData) return;

    const broadcasterId = userData.twitchData.twitchBroadcasterUserId;
    const streamId = userData.twitchData.streamId;

    if (broadcasterId && verifyUserPermission(userId, COGNITO_ROLES.STREAMER, "get end_subs and end_followers count from Twitch API")) {
        const subCount = await getChannelSubscriptionsCount({broadcaster_id: broadcasterId});
        const followerCount = await getChannelFollowersCount({broadcaster_id: broadcasterId});
        setStreamDataEndValues(userId, createTimestamp(), followerCount, subCount);
    }

    if (streamId && verifyUserPermission(userId, COGNITO_ROLES.STREAMER, "send PATCH /stream to api gateway")) {
        await awsStreamController.patchStream(userId);
    }

    await cleanupUserConnections(userId, userData.subscriptions);
    frontendClients.delete(userId);

}


export function checkReadinessAndNotifyFrontend(cognitoUserId: string): void {
    const client = frontendClients.get(cognitoUserId);
    if (!client) return;

    const {readiness} = client;
    if (readiness.twitchReady && readiness.awsReady) {
        sendMessageToFrontendClient(cognitoUserId, {
            type: 'initComplete',
            message: "WebSocket initialization completed",
        });
        logger.info(`All WebSocket handlers executed for user ${cognitoUserId}`, LOG_PREFIX);
    }
}
