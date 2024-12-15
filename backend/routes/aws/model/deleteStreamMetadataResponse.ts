export interface deleteStreamMetadataResponse {
    message?: string;
    details?: {
        streams_deleted: number,
        metadata_deleted: number
    }
}