export interface DeleteStreamMetadataResponse {
    message?: string;
    details?: {
        streams_deleted: number,
        metadata_deleted: number
    }
}