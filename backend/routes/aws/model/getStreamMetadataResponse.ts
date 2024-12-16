export interface GetStreamMetadataResponse {
    "stream_id": string,
    "timestamp": string,
    "metadata": StreamMetadata
}

export interface StreamMetadata {
    "category"?: string
    "viewer_count"?: number
    "message_count"?: number
    "follower_count"?: number
    "subscriber_count"?: number
    "neutral_message_count"?: number
    "negative_message_count"?: number
    "positive_message_count"?: number
}