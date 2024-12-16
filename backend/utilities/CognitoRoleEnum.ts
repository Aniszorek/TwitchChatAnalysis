export const COGNITO_ROLES = {
    STREAMER: "Streamer",
    MODERATOR: "Moderator",
    VIEWER: "Viewer"
};

export type CognitoRole = typeof COGNITO_ROLES[keyof typeof COGNITO_ROLES];