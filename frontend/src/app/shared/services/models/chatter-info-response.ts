export interface GetChatterInfoResponse {
  chatter_user_login: string,
  chatter_user_id: string,
  is_banned: boolean,
  is_timeouted: boolean,
  is_vip: boolean,
  is_mod: boolean
}
