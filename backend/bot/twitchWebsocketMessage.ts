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
            moderator_user_id?: string;
            moderator_user_login?: string;
            moderator_user_name?: string;
            chatter_user_id?: string;
            chatter_user_login?: string;
            chatter_user_name?: string;
            message?: { text: string };
            message_id?: string;
            id?: string;
            user_id?: string;
            user_login?: string;
            user_name?: string;
            title?: string;
            language?: string;
            category_name?: string;
            category_id?: string;
            "content_classification_labels"?: string[]
            "reason"?: string,
            "banned_at"?: string,
            "ends_at"?: string,
            "is_permanent"?: boolean,
            "overall_level"?: number,
            "disability"?: number,
            "aggression"?: number,
            "sexuality_sex_or_gender"?: number,
            "misogyny"?: number,
            "bullying"?: number,
            "swearing"?: number,
            "race_ethnicity_or_religion"?: number,
            "sex_based_terms"?: number,
        };
    };
}