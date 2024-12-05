import express from "express";
import {awsStreamRouter} from "./awsStreamRouter";
import {awsStreamMetadataRouter} from "./awsStreamMetadataRouter";

export const awsRouter = express.Router();

awsRouter.use('/stream', awsStreamRouter)
awsRouter.use('/stream-metadata', awsStreamMetadataRouter)
