import express from "express";
import {createHandlerWithContext} from "../../utilities/utilities";
import {awsTwitchMessageController} from "./controller/awsTwitchMessageController";

export const awsTwitchMessageRouter = express.Router();

awsTwitchMessageRouter.get('/', createHandlerWithContext(awsTwitchMessageController.getTwitchMessages));
