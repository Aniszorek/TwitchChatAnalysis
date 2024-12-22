export interface ChatSettingsResponse {
    data: {
        broadcaster_id: string;
        emote_mode: boolean;
        follower_mode: boolean;
        follower_mode_duration: number;
        moderator_id: string;
        non_moderator_chat_delay: boolean;
        non_moderator_chat_delay_duration: number;
        slow_mode: boolean;
        slow_mode_wait_time: number;
        subscriber_mode: boolean;
        unique_chat_mode: boolean;

    }
}