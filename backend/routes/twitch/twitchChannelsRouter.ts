import express from "express";
import {createHandlerWithContext} from "../../utilities/utilities";
import {twitchChannelController} from "./controller/twitchChannelsController";

export const twitchChannelsRouter = express.Router();

twitchChannelsRouter.get('/followers', createHandlerWithContext(twitchChannelController.getFollowers));
twitchChannelsRouter.get('/vips', createHandlerWithContext(twitchChannelController.getVips));
twitchChannelsRouter.post('/vips', createHandlerWithContext(twitchChannelController.addVip));
twitchChannelsRouter.delete('/vips', createHandlerWithContext(twitchChannelController.deleteVip));
twitchChannelsRouter.post('/polls', createHandlerWithContext(twitchChannelController.createPoll));
twitchChannelsRouter.post('/raids', createHandlerWithContext(twitchChannelController.startRaid));
twitchChannelsRouter.delete('/raids', createHandlerWithContext(twitchChannelController.cancelRaid));
twitchChannelsRouter.patch('/', createHandlerWithContext(twitchChannelController.patchChannelInfo));
