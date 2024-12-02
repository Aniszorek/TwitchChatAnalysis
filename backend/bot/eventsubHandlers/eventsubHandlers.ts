import {TwitchWebSocketMessage} from "../bot";

const LOG_PREFIX = "EVENTSUB_HANDLERS: "

import {
    createPostStreamMetadataInterval,
    deletePostStreamMetadataInterval,
    getFrontendClientTwitchStreamMetadata,
    incrementFollowersCount,
    incrementMessageCount,
    incrementSubscriberCount,
    setFrontendClientTwitchDataStreamId, setFrontendClientTwitchStreamMetadata, TwitchStreamMetadata
} from "../frontendClients";
import {COGNITO_ROLES, verifyUserPermission} from "../../cognitoRoles";
import {sendMessageToApiGateway} from "../../aws/apiGateway";
import {sendMessageToFrontendClient} from "../wsServer";

export const channelChatMessageHandler = (cognitoUserId: string, data: TwitchWebSocketMessage) => {
    const msg = {
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
    console.log(`MSG #${msg.broadcasterUserLogin} <${msg.chatterUserLogin}> ${msg.messageText}`);

    incrementMessageCount(cognitoUserId)

    if (verifyUserPermission(cognitoUserId, COGNITO_ROLES.STREAMER, "send twitch message to aws")) {
        sendMessageToApiGateway(msg, cognitoUserId);
    }

    sendMessageToFrontendClient(cognitoUserId, msg);
}

export const streamOnlineHandler = (cognitoUserId: string, data: TwitchWebSocketMessage) => {
    const streamId = data.payload.event!.id!;
    console.log(`${LOG_PREFIX} Stream online. Stream ID: ${streamId}`);
    setFrontendClientTwitchDataStreamId(cognitoUserId, streamId)

    if(verifyUserPermission(cognitoUserId, COGNITO_ROLES.STREAMER, "create post-stream-metadata-interval"))
        createPostStreamMetadataInterval(cognitoUserId)
}

export const streamOfflineHandler = (cognitoUserId: string, data: TwitchWebSocketMessage) => {
    console.log(`${LOG_PREFIX} Stream offline.`);
    setFrontendClientTwitchDataStreamId(cognitoUserId, null)

    if(verifyUserPermission(cognitoUserId, COGNITO_ROLES.STREAMER, "delete post-stream-metadata-interval"))
        deletePostStreamMetadataInterval(cognitoUserId)
}

export const channelFollowHandler = (cognitoUserId: string, data: TwitchWebSocketMessage) => {
    console.log(`${LOG_PREFIX} new follower: ${data.payload.event?.user_login}`);
    incrementFollowersCount(cognitoUserId)
}

export const channelSubscribeHandler = (cognitoUserId: string, data: TwitchWebSocketMessage) => {
    console.log(`${LOG_PREFIX} new subscriber: ${data.payload.event?.user_login}`);
    incrementSubscriberCount(cognitoUserId)
}

export const channelUpdateHandler = (cognitoUserId: string, data: TwitchWebSocketMessage) => {
    const oldMetadata = getFrontendClientTwitchStreamMetadata(cognitoUserId)
    const newMetadata: TwitchStreamMetadata = {
        title: data.payload.event?.title,
        startedAt: oldMetadata?.startedAt,
        category: data.payload.event?.category_name,
        viewerCount: oldMetadata?.viewerCount,
        followersCount: oldMetadata?.followersCount,
        subscriberCount: oldMetadata?.subscriberCount,
        messageCount: oldMetadata?.messageCount,
        positiveMessageCount: oldMetadata?.positiveMessageCount,
        negativeMessageCount: oldMetadata?.negativeMessageCount,
        neutralMessageCount: oldMetadata?.neutralMessageCount
    }
    setFrontendClientTwitchStreamMetadata(cognitoUserId, newMetadata)
    console.log(`${LOG_PREFIX}: channel updated: title: ${data.payload.event?.title}, category ${data.payload.event?.category_name}`)
}

