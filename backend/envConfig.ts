// GLOBAL VARIABLES - ensure global access by exporting these or writing getter/setter
// todo this token should be delivered from FE
export const TWITCH_BOT_OAUTH_TOKEN = process.env["TWITCH_BOT_OAUTH_TOKEN"] as string; // Needs scopes user:bot, user:read:chat, user:write:chat - konto bota/moderatora
// todo move to entrypoint.js ?
// do przemyślenia co robimy z tymi envami
export const CLIENT_ID = process.env["TWITCH_APP_CLIENT_ID"] as string; // id aplikacji
//////////////////////////////////////////////////////////////////////////////////////