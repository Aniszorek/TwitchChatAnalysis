import express from "express";
import {createHandlerWithContext} from "../../utilities/utilities";
import {twitchChatController} from "./controller/twitchChatController";

export const twitchChatRouter = express.Router();

twitchChatRouter.post('/messages', createHandlerWithContext(twitchChatController.sendChatMessage));
twitchChatRouter.get('/settings', createHandlerWithContext(twitchChatController.getChatSettings));
twitchChatRouter.patch('/settings', createHandlerWithContext(twitchChatController.patchChatSettings));
twitchChatRouter.get('/color', createHandlerWithContext(twitchChatController.getChatColorSettings));
