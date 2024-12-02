import {TwitchWebSocketMessage} from "../bot";

const LOG_PREFIX = "EVENTSUB_HANDLERS: "

import {
    createPostStreamMetadataInterval, deletePostStreamMetadataInterval, incrementFollowersCount,
    incrementMessageCount, incrementSubscriberCount,
    setFrontendClientTwitchDataStreamId
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

