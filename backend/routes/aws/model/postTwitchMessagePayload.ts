export interface PostTwitchMessagePayload {
    chatter_user_login: string
    message_text: string
    timestamp: string
    stream_id: string | undefined | null,
    message_id: string
}