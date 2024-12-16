export interface ValidateUserRolePayload {
    oauth_token: string,
    cognito_username: string,
    broadcaster_user_login: string,
    client_id: string
}