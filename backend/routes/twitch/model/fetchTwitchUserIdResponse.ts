export interface FetchTwitchUserIdResponse {
    found: boolean;
    userId: string | null;
    displayName: string | null;
}