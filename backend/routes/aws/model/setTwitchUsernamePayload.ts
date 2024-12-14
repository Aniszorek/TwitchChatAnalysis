export interface SetTwitchUsernamePayload {
    cognitoIdToken: string;
    twitchBroadcasterUsername: string;
}

export const isSetTwitchUsernamePayload = (obj:any): obj is SetTwitchUsernamePayload => {
    const isOk = obj.cognitoIdToken !== undefined &&
        obj.twitchBroadcasterUsername !== undefined
    if(isOk){
        return isOk
    }
    else{
        throw Error(`object is not valid SetTwitchUsernamePayload: ${JSON.stringify(obj)}`);
    }
}