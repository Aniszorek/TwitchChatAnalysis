export interface CognitoIdTokenData {
    "cognito:username": string;
}

export interface ValidateUserRoleResponse {
    statusCode: number;
    body: {
        role: string;
    };
}