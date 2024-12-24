export type SuspendedUser = {
    user_id: string;
    user_login: string;
    user_name: string;
    expires_at: string;
    created_at: string;
    reason: string;
    moderator_id: string;
    moderator_login: string;
    moderator_name: string;
};

export type SuspendedUsersResponse = {
    banned_users: SuspendedUser[];
    timed_out_users: SuspendedUser[];
};
