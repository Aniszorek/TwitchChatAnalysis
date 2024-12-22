export type PostBlockedTermPayload = {
    text: string;
}
export const isPostBlockedTermPayload = (obj:any): obj is PostBlockedTermPayload => {
    const isOk = obj.text !== undefined
    if(isOk){
        return isOk
    }
    else{
        throw Error(`object is not valid PostBlockedTermPayload: ${JSON.stringify(obj)}`);
    }
}