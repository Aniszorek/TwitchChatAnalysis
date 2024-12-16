import {FetchTwitchStreamData} from "./fetchTwitchStreamDataResponse";

export interface VerifyTwitchUsernameAndStreamStatusResponse {
    success: boolean;
    message: string;
    streamStatus?: FetchTwitchStreamData;
    userId?: string
}