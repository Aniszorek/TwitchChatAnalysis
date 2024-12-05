import express from "express";
import {awsStreamRouter} from "./awsStreamRouter";

export const awsRouter = express.Router();

awsRouter.use('/stream', awsStreamRouter)
