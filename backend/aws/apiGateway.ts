import axios, {AxiosResponse} from "axios";
import jwt from "jsonwebtoken";
import { DateTime } from 'luxon';

import {isCognitoRoleValid} from "../cognitoRoles";
import {
    frontendClients,
    getFrontendClientTwitchStreamMetadata, refreshStreamMetadataCounters,
    setFrontendClientTwitchStreamMetadata,
    TwitchStreamMetadata
} from "../bot/frontendClients";
import {fetchTwitchStreamMetadata, TwitchStreamData} from "../twitch_calls/twitchAuth";

const API_GATEWAY_URL = "https://t7pqmsv4x4.execute-api.eu-central-1.amazonaws.com/test";
const MESSAGES_PATH = `${API_GATEWAY_URL}/twitch-message`;
const STREAM_METADATA_PATH = `${API_GATEWAY_URL}/stream-metadata`;
const UPDATE_USER_PATH = `${API_GATEWAY_URL}/twitchChatAnalytics-authorization`;
const STREAM_PATH = `${API_GATEWAY_URL}/stream`;

const LOG_PREFIX = `API_GATEWAY_REST:`;

export const METADATA_SEND_INTERVAL = 5 * 60 * 1000

interface TwitchMessage {
    broadcasterUserId: string,
    broadcasterUserLogin: string,
    broadcasterUserName: string,
    chatterUserId: string,
    chatterUserLogin: string,
    chatterUserName: string,
    messageText: string,
    messageId: string,
    messageTimestamp: string,
}

interface StreamMetadataMessage {
    stream_id: string,
    timestamp: string,
    viewer_count?: number,
    category?: string,
    follower_count?: number,
    subscriber_count?: number,
    message_count?: number,
    positive_message_count?: number,
    negative_message_count?: number,
    neutral_message_count?: number
}

interface PostStreamMessage {
    stream_id: string,
    broadcaster_username: string,
    stream_title: string,
    started_at: string,
    start_follows: number,
    start_subs: number,
    ended_at?: string,
    end_follows?: number,
    end_subs?: number
}

interface PatchStreamMessage {
    stream_id: string,
    ended_at?: string,
    end_follows?: number,
    end_subs?: number
}

interface CognitoIdTokenData {
    "cognito:username": string;
}

interface ValidateUserRoleResponse {
    statusCode: number;
    body: {
        role: string;
    };
}

/**
 * Forwards messages from Twitch EventSub to AWS ApiGateway
 */
export async function postMessageToApiGateway(msg: TwitchMessage, cognitoUserId: string) {
    try {
        const cognitoIdToken = frontendClients.get(cognitoUserId)?.cognito?.cognitoIdToken;

        if (!cognitoIdToken) {
            console.error(`${LOG_PREFIX} Cognito token missing in wsServer for user: ${cognitoUserId}`);
            return;
        }

        const streamId = frontendClients.get(cognitoUserId)?.twitchData?.streamId;

        const response = await axios.post(MESSAGES_PATH, {
            chatter_user_login: msg.chatterUserLogin,
            message_text: msg.messageText,
            timestamp: msg.messageTimestamp,
            stream_id: streamId
        }, {
            headers: {
                Authorization: `Bearer ${cognitoIdToken}`,
                "Content-Type": "application/json",
                BroadcasterUserLogin: msg.broadcasterUserLogin,
            },
        });

        if (response.status === 200) {
            console.log(`${LOG_PREFIX} Message sent to API Gateway: ${msg.messageText}`);
        } else {
            console.error(`${LOG_PREFIX} Failed to send message to API Gateway. Status: ${response.status}`);
        }
    } catch (error: any) {
        console.error(`${LOG_PREFIX} Error sending message to API Gateway: ${error.message}`);
    }
}


/**
 * Validates if user who passed twitch Oauth is a viewer, moderator or streamer for specified broadcaster
 */
export async function validateUserRole(twitch_oauth_token: string, broadcaster_user_login: string, client_id: string, cognitoIdToken: string) {
    try {
        const decoded: CognitoIdTokenData | null = jwt.decode(cognitoIdToken) as CognitoIdTokenData | null;
        if (!decoded?.["cognito:username"]) {
            console.error(`${LOG_PREFIX} Invalid Cognito token`);
            return undefined;
        }
        const username = decoded["cognito:username"];

        const response: AxiosResponse<ValidateUserRoleResponse> = await axios.post(UPDATE_USER_PATH, {
            oauth_token: twitch_oauth_token,
            cognito_username: username,
            broadcaster_user_login: broadcaster_user_login,
            client_id: client_id
        }, {
            headers: {
                'Authorization': `Bearer ${cognitoIdToken}`, 'Content-Type': 'application/json'
            }
        });

        const {statusCode, body} = response.data;


        if (!isCognitoRoleValid(body.role)) {
            console.error(`${LOG_PREFIX} Unknown role: ${body.role} - Status: ${JSON.stringify(body)}`);
            return undefined;
        }

        if (statusCode === 200) {
            console.log(
                `${LOG_PREFIX} Data sent to API Gateway: ${broadcaster_user_login} ${username}. Response: ${JSON.stringify(body)}`
            );
            return {role: body.role, cognitoUsername: username};
        } else {
            console.error(`${LOG_PREFIX} Failed authorization. Status: ${JSON.stringify(body)}`);
            return undefined;
        }

    } catch (error: any) {
        console.error(`${LOG_PREFIX} [ValidateUserRole] Error sending message to API Gateway: ${error.message}`);
        return undefined;
    }
}

export async function postMetadataToApiGateway(cognitoUserId: string) {

    const { client, cognitoIdToken } = getClientAndCognitoIdToken(cognitoUserId)

    // required:
    const stream_id = client.twitchData.streamId
    const timestamp = createTimestamp()
    const broadcasterUserLogin = client.twitchData.twitchBroadcasterUsername
    const broadcasterId = client.twitchData.twitchBroadcasterUserId;


    if(!stream_id)
    {
        throw new Error(`missing stream_id for cognitoUserId: ${cognitoUserId}`);
    }
    if(!broadcasterUserLogin)
    {
        throw new Error(`missing broadcasterUserLogin for cognitoUserId: ${cognitoUserId}`);
    }

    if (!broadcasterId) {
        throw new Error(`broadcasterId not found for cognitoUserId: ${cognitoUserId}`);
    }

    // fetch current streamStatus (category, title, viewerCount)
    const streamStatus: TwitchStreamData = await fetchTwitchStreamMetadata(broadcasterId);
    if(streamStatus.stream_id === stream_id)
    {
        const oldMetadata = getFrontendClientTwitchStreamMetadata(cognitoUserId)
        const newMetadata: TwitchStreamMetadata = {
            title: streamStatus.title,
            category: streamStatus.category,
            viewerCount: streamStatus.viewer_count,
            followersCount: oldMetadata?.followersCount,
            subscriberCount: oldMetadata?.subscriberCount,
            messageCount: oldMetadata?.messageCount,
            positiveMessageCount: oldMetadata?.positiveMessageCount,
            negativeMessageCount: oldMetadata?.negativeMessageCount,
            neutralMessageCount: oldMetadata?.neutralMessageCount
        }
        setFrontendClientTwitchStreamMetadata(cognitoUserId, newMetadata)
    }

    const metadata: StreamMetadataMessage = {
        stream_id: stream_id,
        timestamp: timestamp,
        viewer_count: client.twitchData.streamMetadata.viewerCount,
        category: client.twitchData.streamMetadata.category,
        follower_count: client.twitchData.streamMetadata.followersCount,
        subscriber_count: client.twitchData.streamMetadata.subscriberCount,
        message_count: client.twitchData.streamMetadata.messageCount,
        positive_message_count: client.twitchData.streamMetadata.positiveMessageCount,
        negative_message_count: client.twitchData.streamMetadata.negativeMessageCount,
        neutral_message_count: client.twitchData.streamMetadata.neutralMessageCount
    }

    const response = await axios.post(STREAM_METADATA_PATH, metadata,
        {
        headers: {
            Authorization: `Bearer ${cognitoIdToken}`,
            "Content-Type": "application/json",
            BroadcasterUserLogin: broadcasterUserLogin,
        },
    });

    if (response.status === 200) {
        console.log(`${LOG_PREFIX} Metadata sent to API Gateway: ${JSON.stringify(metadata)}`);

    } else {
        console.error(`${LOG_PREFIX} Failed to send metadata to API Gateway. Status: ${response.status}`);
    }

    refreshStreamMetadataCounters(cognitoUserId);
}

export async function postStreamToApiGateway(cognitoUserId: string) {

    const { client, cognitoIdToken } = getClientAndCognitoIdToken(cognitoUserId)

    // required
    const stream_id = client.twitchData.streamId
    const broadcasterUsername = client.twitchData.twitchBroadcasterUsername
    const streamTitle = client.twitchData.streamMetadata.title
    const startedAt = client.twitchData.streamData.startedAt
    const startFollows = client.twitchData.streamData.startFollows
    const startSubs = client.twitchData.streamData.startSubs
    // TODO fetch startFollows at the begining of the stream
    // TODO fetch endFollows too
    // TODO start/end subs too

    // TODO at the end of the stream (or connection end):
    // TODO PATCH /stream with end subs,follows and timestamp ended at
    // TODO GET /stream?broadcaster_username for frontend (also on AWS)
    // TODO refactor names in this file from send... to post.. accordingly to the method it executes


    if(!stream_id)
    {
        throw new Error(`missing stream_id for cognitoUserId: ${cognitoUserId}`);
    }
    if(!broadcasterUsername)
    {
        throw new Error(`missing broadcasterUsername for cognitoUserId: ${cognitoUserId}`);
    }
    if(!streamTitle)
    {
        throw new Error(`missing streamTitle for cognitoUserId: ${cognitoUserId}`);
    }
    if(startedAt === undefined)
    {
        throw new Error(`missing startedAt for cognitoUserId: ${cognitoUserId}`);
    }
    if(!startFollows)
    {
        throw new Error(`missing startFollows for cognitoUserId: ${cognitoUserId}`);
    }
    if(startSubs === undefined)
    {
        throw new Error(`missing startSubs for cognitoUserId: ${cognitoUserId}`);
    }

    const streamMessage: PostStreamMessage = {
        stream_id: stream_id,
        broadcaster_username: broadcasterUsername,
        stream_title: streamTitle,
        started_at: startedAt,
        start_follows: startFollows,
        start_subs: startSubs
    }

    const response = await axios.post(STREAM_PATH, streamMessage,
        {
            headers: {
                Authorization: `Bearer ${cognitoIdToken}`,
                "Content-Type": "application/json",
                BroadcasterUserLogin: broadcasterUsername,
            },
        });

    if (response.status === 200) {
        console.log(`${LOG_PREFIX} Stream sent to API Gateway: ${JSON.stringify(streamMessage)}`);

    } else {
        console.error(`${LOG_PREFIX} Failed to send stream to API Gateway. Status: ${response.status}`);
    }
}

export async function patchStreamToApiGateway(cognitoUserId: string) {

    const { client, cognitoIdToken } = getClientAndCognitoIdToken(cognitoUserId)

    // required
    const stream_id = client.twitchData.streamId
    const broadcasterUsername = client.twitchData.twitchBroadcasterUsername


    // optional
    const ended_at = createTimestamp()
    const end_follows = client.twitchData.streamData.endFollows
    const end_subs = client.twitchData.streamData.endSubs

    if(!stream_id)
    {
        throw new Error(`missing stream_id for cognitoUserId: ${cognitoUserId}`);
    }
    if(!broadcasterUsername)
    {
        throw new Error(`missing broadcasterUsername for cognitoUserId: ${cognitoUserId}`);
    }

    const streamMessage: PatchStreamMessage = {
        stream_id: stream_id,
        ended_at: ended_at,
        end_follows: end_follows,
        end_subs: end_subs
    }

    const response = await axios.patch(STREAM_PATH, streamMessage,
        {
            headers: {
                Authorization: `Bearer ${cognitoIdToken}`,
                "Content-Type": "application/json",
                BroadcasterUserLogin: broadcasterUsername
            },
        });

    if (response.status === 200) {
        console.log(`${LOG_PREFIX} Stream updated to API Gateway: ${JSON.stringify(streamMessage)}`);

    } else {
        console.error(`${LOG_PREFIX} Failed to update stream to API Gateway. Status: ${response.status}`);
    }
}



const createTimestamp = (): string => {
    const now = DateTime.now().toUTC()
    const milliseconds = now.toFormat("SSS");
    const microseconds = milliseconds + "000";
    return now.toFormat("yyyy-LL-dd HH:mm:ss") + `.${microseconds}` + now.toFormat("ZZ");
}

const getClientAndCognitoIdToken = (cognitoUserId: string) => {
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