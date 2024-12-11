import express from "express";
import {createHandlerWithContext} from "../../utilities/utilities";
import {twitchModerationController} from "./controller/twitchModerationController";

export const twitchModerationRouter = express.Router();

twitchModerationRouter.get('/moderators', createHandlerWithContext(twitchModerationController.getModerators));
twitchModerationRouter.post('/bans', createHandlerWithContext(twitchModerationController.banUser));
twitchModerationRouter.delete('/bans', createHandlerWithContext(twitchModerationController.unbanUser));
twitchModerationRouter.post('/moderators', createHandlerWithContext(twitchModerationController.addModerator));
twitchModerationRouter.delete('/moderators', createHandlerWithContext(twitchModerationController.removeModerator));
twitchModerationRouter.delete('/chat', createHandlerWithContext(twitchModerationController.deleteMessage));
twitchModerationRouter.get('/automod/settings', createHandlerWithContext(twitchModerationController.getAutomodSettings));
twitchModerationRouter.put('/automod/settings', createHandlerWithContext(twitchModerationController.putAutomodSettings));
twitchModerationRouter.get('/blocked_terms', createHandlerWithContext(twitchModerationController.getBlockedTerms));
twitchModerationRouter.post('/blocked_terms', createHandlerWithContext(twitchModerationController.addBlockedTerm));
twitchModerationRouter.delete('/blocked_terms', createHandlerWithContext(twitchModerationController.deleteBlockedTerm));


