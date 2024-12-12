import express from "express";
import {createHandlerWithContext} from "../../utilities/utilities";
import {twitchSearchController} from "./controller/twitchSearchController";

export const twitchSearchRouter = express.Router();

twitchSearchRouter.get('/categories', createHandlerWithContext(twitchSearchController.searchCategories));