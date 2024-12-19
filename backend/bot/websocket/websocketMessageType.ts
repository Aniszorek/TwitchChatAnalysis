export const WEBSOCKET_MESSAGE_TYPE = {
    TWITCH_MESSAGE: "TwitchMessage",
    NLP_MESSAGE: "NlpMessage",
    MESSAGE_DELETED: "MessageDeleted",
    INIT_COMPLETE: "InitComplete",
};

export type WebsocketMessageType = typeof WEBSOCKET_MESSAGE_TYPE[keyof typeof WEBSOCKET_MESSAGE_TYPE];