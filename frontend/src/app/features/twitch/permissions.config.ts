export enum Tab {
  DASHBOARD,
  CHARTS
}

export enum UserRole {
  VIEWER = "Viewer",
  STREAMER = "Streamer",
  MODERATOR = "Moderator"
}

export const ROLE_PERMISSIONS: Record<UserRole, Tab[]> = {
  [UserRole.VIEWER]: [Tab.DASHBOARD],
  [UserRole.STREAMER]: [Tab.DASHBOARD, Tab.CHARTS],
  [UserRole.MODERATOR]: [Tab.DASHBOARD, Tab.CHARTS],
};

export function hasAccess(userRole: UserRole | null, section: Tab): boolean {
  if (!userRole) return false;
  const allowedSections = ROLE_PERMISSIONS[userRole];
  return allowedSections?.includes(section) ?? false;
}
