import {TwitchWebSocketMessage} from "../bot";
import {
    createPostStreamMetadataInterval,
    deletePostStreamMetadataInterval,
    getFrontendClientTwitchStreamMetadata,
    incrementFollowersCount,
    incrementMessageCount,
    incrementSubscriberCount,
    setFrontendClientTwitchDataStreamId,
    setFrontendClientTwitchStreamMetadata,
    setStreamDataEndValues,
    setStreamDataStartValues,
    TwitchStreamMetadata
} from "../frontendClients";
import {sendMessageToFrontendClient} from "../wsServer";
import {fetchTwitchStreamMetadata, TwitchStreamData} from "../../twitch_calls/twitchAuth";
import {getChannelSubscriptionsCount} from "../../twitch_calls/twitch/getBroadcastersSubscriptions";
import {getChannelFollowersCount} from "../../twitch_calls/twitchChannels/getChannelFollowers";
import {createTimestamp} from "../../utilities/utilities";
import {LogColor, logger} from "../../utilities/logger";
import {awsStreamController} from "../../routes/aws/controller/awsStreamController";
import {TwitchMessage} from "../../routes/aws/model/twitchMessage";
import {awsTwitchMessageController} from "../../routes/aws/controller/awsTwitchMessageController";
import {verifyUserPermission} from "../../cognitoRoles";
import {COGNITO_ROLES} from "../../utilities/CognitoRoleEnum";

const LOG_PREFIX = "EVENTSUB_HANDLERS"

export const channelChatMessageHandler = (cognitoUserId: string, data: TwitchWebSocketMessage) => {
    const msg:TwitchMessage = {
        "broadcasterUserId": data.payload.event!.broadcaster_user_id!,
        "broadcasterUserLogin": data.payload.event!.broadcaster_user_login!,
        "broadcasterUserName": data.payload.event!.broadcaster_user_name!,
        "chatterUserId": data.payload.event!.chatter_user_id!,
        "chatterUserLogin": data.payload.event!.chatter_user_login!,
        "chatterUserName": data.payload.event!.chatter_user_name!,
        "messageText": data.payload.event!.message!.text,
        "messageId": data.payload.event!.message_id!,
        "messageTimestamp": data.metadata.message_timestamp!
    }
    logger.info(`MSG #${msg.broadcasterUserLogin} <${msg.chatterUserLogin}> <${msg.messageId}> ${msg.messageText}`, LOG_PREFIX, {color: LogColor.MAGENTA});

    incrementMessageCount(cognitoUserId)

    if (verifyUserPermission(cognitoUserId, COGNITO_ROLES.STREAMER, "send twitch message to aws")) {
        awsTwitchMessageController.postTwitchMessage(msg, cognitoUserId);
    }

    sendMessageToFrontendClient(cognitoUserId, msg);
}

export const streamOnlineHandler = async (cognitoUserId: string, data: TwitchWebSocketMessage) => {
    const streamId = data.payload.event!.id!;
    const broadcasterId = data.payload.event!.broadcaster_user_id!;
    logger.info(`Stream online. Stream ID: ${streamId}`, LOG_PREFIX, {color: LogColor.MAGENTA});
    setFrontendClientTwitchDataStreamId(cognitoUserId, streamId)

    const streamStatus: TwitchStreamData = await fetchTwitchStreamMetadata(broadcasterId);
    const startedAt = streamStatus?.started_at

    const oldMetadata = getFrontendClientTwitchStreamMetadata(cognitoUserId);
    const newMetadata: TwitchStreamMetadata = {
        title: streamStatus?.title,
        category: streamStatus?.category,
        viewerCount: streamStatus?.viewer_count!,
        followersCount: oldMetadata?.followersCount,
        subscriberCount: oldMetadata?.subscriberCount,
        messageCount: oldMetadata?.messageCount,
        veryNegativeMessageCount: oldMetadata?.veryNegativeMessageCount,
        negativeMessageCount: oldMetadata?.negativeMessageCount,
        slightlyNegativeMessageCount: oldMetadata?.slightlyNegativeMessageCount,
        neutralMessageCount: oldMetadata?.neutralMessageCount,
        slightlyPositiveMessageCount: oldMetadata?.slightlyPositiveMessageCount,
        positiveMessageCount: oldMetadata?.positiveMessageCount,
        veryPositiveMessageCount: oldMetadata?.veryPositiveMessageCount
    }
    setFrontendClientTwitchStreamMetadata(cognitoUserId,newMetadata)

    if (verifyUserPermission(cognitoUserId, COGNITO_ROLES.STREAMER, "create post-stream-metadata-interval"))
        createPostStreamMetadataInterval(cognitoUserId)

    if(streamId && startedAt && verifyUserPermission(cognitoUserId, COGNITO_ROLES.STREAMER, "get start_subs and start_followers count from Twitch API"))
    {
        const subCount = await getChannelSubscriptionsCount({broadcaster_id: broadcasterId})
        const followerCount = await getChannelFollowersCount({broadcaster_id: broadcasterId})
        setStreamDataStartValues(cognitoUserId, startedAt, followerCount, subCount)
    }

    if (verifyUserPermission(cognitoUserId, COGNITO_ROLES.STREAMER, "send POST /stream to api gateway"))
    {
        // sometimes twitch /get-streams endpoint is not ready at the moment of getting this event
        // so we wait a moment
        setTimeout(() => {
                awsStreamController.postStream(cognitoUserId);
        }, 3000)
    }
}

export const streamOfflineHandler = async (cognitoUserId: string, data: TwitchWebSocketMessage) => {

    logger.info(`Stream offline.`, LOG_PREFIX, {color: LogColor.MAGENTA});
    const broadcasterId = data.payload.event!.broadcaster_user_id!;

    if(verifyUserPermission(cognitoUserId, COGNITO_ROLES.STREAMER, "get end_subs and end_followers count from Twitch API"))
    {
        const subCount = await getChannelSubscriptionsCount({broadcaster_id: broadcasterId})
        const followerCount = await getChannelFollowersCount({broadcaster_id: broadcasterId})
        setStreamDataEndValues(cognitoUserId,  createTimestamp(), followerCount, subCount)
    }

    if (verifyUserPermission(cognitoUserId, COGNITO_ROLES.STREAMER, "send PATCH /stream to api gateway"))
        await awsStreamController.patchStream(cognitoUserId)

    setFrontendClientTwitchDataStreamId(cognitoUserId, null)

    if(verifyUserPermission(cognitoUserId, COGNITO_ROLES.STREAMER, "delete post-stream-metadata-interval"))
        deletePostStreamMetadataInterval(cognitoUserId)
}

export const channelFollowHandler = (cognitoUserId: string, data: TwitchWebSocketMessage) => {
    logger.info(`new follower: ${data.payload.event?.user_login}`, LOG_PREFIX, {color: LogColor.MAGENTA});
    incrementFollowersCount(cognitoUserId)
}

export const channelSubscribeHandler = (cognitoUserId: string, data: TwitchWebSocketMessage) => {
    logger.info(`new subscriber: ${data.payload.event?.user_login}`, LOG_PREFIX, {color: LogColor.MAGENTA});
    incrementSubscriberCount(cognitoUserId)
}

export const channelUpdateHandler = (cognitoUserId: string, data: TwitchWebSocketMessage) => {
    const oldMetadata = getFrontendClientTwitchStreamMetadata(cognitoUserId)
    const newMetadata: TwitchStreamMetadata = {
        title: data.payload.event?.title,
        category: data.payload.event?.category_name,
        viewerCount: oldMetadata?.viewerCount,
        followersCount: oldMetadata?.followersCount,
        subscriberCount: oldMetadata?.subscriberCount,
        messageCount: oldMetadata?.messageCount,
        veryNegativeMessageCount: oldMetadata?.veryNegativeMessageCount,
        negativeMessageCount: oldMetadata?.negativeMessageCount,
        slightlyNegativeMessageCount: oldMetadata?.slightlyNegativeMessageCount,
        neutralMessageCount: oldMetadata?.neutralMessageCount,
        slightlyPositiveMessageCount: oldMetadata?.slightlyPositiveMessageCount,
        positiveMessageCount: oldMetadata?.positiveMessageCount,
        veryPositiveMessageCount: oldMetadata?.veryPositiveMessageCount
    }
    setFrontendClientTwitchStreamMetadata(cognitoUserId, newMetadata)
    logger.info(`channel updated: title: ${data.payload.event?.title}, category ${data.payload.event?.category_name}`, LOG_PREFIX, {color: LogColor.MAGENTA})
}

export const channelChatDeleteMessageHandler = (cognitoUserId: string, data: TwitchWebSocketMessage) => {
    const message_id = data.payload.event?.message_id
    logger.info(`Received message delete event, message_id: ${message_id}`, LOG_PREFIX, {color: LogColor.MAGENTA});
    sendMessageToFrontendClient(cognitoUserId, message_id)

}

