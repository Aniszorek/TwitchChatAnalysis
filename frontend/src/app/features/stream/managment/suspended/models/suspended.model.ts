export interface User {
  user_id: string;
  user_login: string;
  user_name: string;
  expires_at: string;
  created_at: string;
}

export interface SuspendedUsers {
  banned_users: User[];
  timed_out_users: User[];
}
