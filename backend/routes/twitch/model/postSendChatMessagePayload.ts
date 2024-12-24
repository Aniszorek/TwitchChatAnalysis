export type SendChatMessagePayload = {
    broadcaster_id: string;
    sender_id: string;
    message: string;
}
export const isSendChatMessagePayload = (obj:any): obj is SendChatMessagePayload => {
    const isOk = obj.broadcaster_id !== undefined &&
        obj.sender_id !== undefined &&
        obj.message !== undefined

    if(isOk){
        return isOk
    }
    else{
        throw Error(`object is not valid SendChatMessagePayload: ${JSON.stringify(obj)}`);
    }
}