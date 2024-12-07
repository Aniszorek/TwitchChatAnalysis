import express from "express";
import {awsStreamRouter} from "./awsStreamRouter";
import {awsStreamMetadataRouter} from "./awsStreamMetadataRouter";
import {awsTwitchMessageRouter} from "./awsTwitchMessageRouter";

export const awsRouter = express.Router();

awsRouter.use('/stream', awsStreamRouter)
awsRouter.use('/stream-metadata', awsStreamMetadataRouter)
awsRouter.use('/twitch-message', awsTwitchMessageRouter)
