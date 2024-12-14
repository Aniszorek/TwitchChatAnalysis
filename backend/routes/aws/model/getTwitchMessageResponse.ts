export interface GetTwitchMessageResponse {
    chatter_user_login: string;
    is_banned?: boolean;
    is_timeouted?: boolean;
    is_vip?: boolean;
    is_mod?: boolean;
    messages: TwitchMessageData[];
}

export interface TwitchMessageData {
    stream_id: string,
    broadcaster_user_login: string,
    chatter_user_login: string,
    message_text: string,
    nlp_classification: string,
    timestamp: string
}