export interface PostTwitchMessagePayload {
    chatter_user_id: string
    chatter_user_login: string
    chatter_user_name: string
    message_text: string
    timestamp: string
    stream_id: string | undefined | null,
    message_id: string
}