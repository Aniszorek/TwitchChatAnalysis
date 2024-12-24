export const WEBSOCKET_MESSAGE_TYPE = {
    AUTOMOD_SETTINGS_UPDATE: "AutomodSettingsUpdate",
    TWITCH_MESSAGE: "TwitchMessage",
    NLP_MESSAGE: "NlpMessage",
    MESSAGE_DELETED: "MessageDeleted",
    INIT_COMPLETE: "InitComplete",
    MODERATOR_ADD: "ModeratorAdd",
    MODERATOR_REMOVE: "ModeratorRemove",
    CHANNEL_BAN: "ChannelBan",
    CHANNEL_UNBAN: "ChannelUnban",
    CHANNEL_VIP_ADD: "ChannelVipAdd",
    CHANNEL_VIP_REMOVE: "ChannelVipRemove",
    CHANNEL_UPDATE: "ChannelUpdate",
};

export type WebsocketMessageType = typeof WEBSOCKET_MESSAGE_TYPE[keyof typeof WEBSOCKET_MESSAGE_TYPE];