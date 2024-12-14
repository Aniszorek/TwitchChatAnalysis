export interface VerifyCognitoPayload {
    idToken: string;
}

export const isVerifyCognitoPayload = (obj:any): obj is VerifyCognitoPayload => {
    const isOk = obj.idToken !== undefined
    if(isOk){
        return isOk
    }
    else{
        throw Error(`object is not valid VerifyCognitoPayload: ${JSON.stringify(obj)}`);
    }
}