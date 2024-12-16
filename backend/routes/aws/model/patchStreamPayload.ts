export interface PatchStreamPayload {
    stream_id: string,
    ended_at?: string,
    end_follows?: number,
    end_subs?: number
}