import express from "express";
import {createHandlerWithContext} from "../../utilities/utilities";
import {awsStreamController} from "./controller/awsStreamController";

export const awsStreamRouter = express.Router();

awsStreamRouter.get('/', createHandlerWithContext(awsStreamController.getStream));
awsStreamRouter.delete('/', createHandlerWithContext(awsStreamController.deleteStream));
