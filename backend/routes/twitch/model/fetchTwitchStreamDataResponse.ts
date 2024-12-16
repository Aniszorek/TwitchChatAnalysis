export interface FetchTwitchStreamData {
    stream_id: string | undefined;
    title?: string;
    viewer_count?: number;
    started_at?: string;
    category?: string;
}