 export interface PostStreamMetadataPayload {
     stream_id: string,
     timestamp: string,
     viewer_count?: number,
     category?: string,
     follower_count?: number,
     subscriber_count?: number,
     message_count?: number,
     very_negative_message_count?: number,
     negative_message_count?: number,
     slightly_negative_message_count?: number,
     neutral_message_count?: number
     slightly_positive_message_count?: number
     positive_message_count?: number,
     very_positive_message_count?: number
 }