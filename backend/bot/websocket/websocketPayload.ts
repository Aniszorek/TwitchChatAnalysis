import {WebsocketMessageType} from "./websocketMessageType";

export interface WebsocketPayload  {
    type: WebsocketMessageType;
    messageObject: object;
}