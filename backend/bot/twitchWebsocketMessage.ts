export interface TwitchWebSocketMessage {
    metadata: {
        message_type: string;
        subscription_type?: string;
        message_timestamp?: string;
    };
    payload: {
        session?: { id: string };
        event?: {
            broadcaster_user_id?: string;
            broadcaster_user_login?: string;
            broadcaster_user_name?: string;
            chatter_user_id?: string;
            chatter_user_login?: string;
            chatter_user_name?: string;
            message?: { text: string };
            message_id?: string;
            id?: string; // For stream.online events
            user_login?: string; // for channel.follow, subscribe, subscription.message events
            title?: string; // for channel.update event
            category_name?: string; // for channel.update event
        };
    };
}