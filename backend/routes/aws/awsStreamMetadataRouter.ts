import express from "express";
import {createHandlerWithContext} from "../../utilities/utilities";
import {awsStreamMetadataController} from "./controller/awsStreamMetadataController";

export const awsStreamMetadataRouter = express.Router();

awsStreamMetadataRouter.get('/', createHandlerWithContext(awsStreamMetadataController.getStreamMetadata));
