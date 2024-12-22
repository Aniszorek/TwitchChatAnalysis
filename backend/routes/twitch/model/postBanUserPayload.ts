export type BanUserPayload = {
    broadcaster_id: string;
    moderator_id: string;
    data: {
        user_id: string,
        duration?: number; // in seconds
        reason?: string
    }
}
export const isBanUserPayload = (obj:any): obj is BanUserPayload => {
    const isOk = obj.broadcaster_id !== undefined &&
        obj.moderator_id !== undefined &&
        obj.data !== undefined &&
        obj.data.user_id !== undefined
    if(isOk){
        return isOk
    }
    else{
        throw Error(`object is not valid BanUserPayload: ${JSON.stringify(obj)}`);
    }
}