 export interface PostStreamPayload {
     stream_id: string,
     broadcaster_username: string,
     stream_title: string,
     started_at: string,
     start_follows: number,
     start_subs: number,
     ended_at?: string,
     end_follows?: number,
     end_subs?: number
 }