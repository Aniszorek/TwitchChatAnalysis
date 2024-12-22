import express from "express";
import {createHandlerWithContext} from "../../utilities/utilities";
import {twitchUsersController} from "./controller/twitchUsersController";

export const twitchUsersRouter = express.Router();

twitchUsersRouter.get('/suspended', createHandlerWithContext(twitchUsersController.getSuspended));
twitchUsersRouter.get('/chatter-info', createHandlerWithContext(twitchUsersController.getChatterInfo));