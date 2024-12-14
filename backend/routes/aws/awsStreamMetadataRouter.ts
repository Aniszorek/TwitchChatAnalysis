import express from "express";
import {getChannelFollowersCount} from "../../twitch_calls/twitchChannels/getChannelFollowers";
import {logger} from "../../utilities/logger";
import {getStreamsByBroadcasterUsernameFromApiGateway} from "../../api_gateway_calls/stream/getStreamByBroadcaster";
import {verifyToken} from "../../aws/cognitoAuth";
import {getStreamFromApiGateway, GetStreamMessage} from "../../api_gateway_calls/stream/getStream";
import axios from "axios";
import {
    getStreamMetadataByStreamIdFromApiGateway
} from "../../api_gateway_calls/stream-metadata/getStreamMetadataByStreamId";
import {createHandlerWithContext} from "../../utilities/utilities";
import {awsStreamMetadataController} from "./controller/awsStreamMetadataController";

export const awsStreamMetadataRouter = express.Router();

awsStreamMetadataRouter.get('/', createHandlerWithContext(awsStreamMetadataController.getStreamMetadata));
