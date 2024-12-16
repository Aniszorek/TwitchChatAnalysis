export interface RefreshCognitoTokenPayload {
    refreshToken: string;
}

export const isRefreshCognitoTokenPayload = (obj:any): obj is RefreshCognitoTokenPayload => {
    const isOk = obj.refreshToken !== undefined
    if(isOk){
        return isOk
    }
    else{
        throw Error(`object is not valid RefreshCognitoTokenPayload: ${JSON.stringify(obj)}`);
    }
}