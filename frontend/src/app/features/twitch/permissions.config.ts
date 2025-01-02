export enum Tab {
  DASHBOARD,
  CHARTS,
  SUSPENDED,
  MOD_VIP,
  AUTOMOD,
  BLOCKEDTERMS,
  STREAMSETTINGS,
  RAIDPOLL,
  MESSAGEHISTORY,
  MANAGEMENT
}

export enum UserRole {
  VIEWER = "Viewer",
  STREAMER = "Streamer",
  MODERATOR = "Moderator"
}

export const ROLE_PERMISSIONS: Record<UserRole, Tab[]> = {
  [UserRole.VIEWER]: [Tab.DASHBOARD],
  [UserRole.STREAMER]: [Tab.DASHBOARD, Tab.CHARTS, Tab.SUSPENDED, Tab.MOD_VIP, Tab.AUTOMOD, Tab.BLOCKEDTERMS, Tab.STREAMSETTINGS, Tab.RAIDPOLL, Tab.MESSAGEHISTORY, Tab.MANAGEMENT],
  [UserRole.MODERATOR]: [Tab.DASHBOARD, Tab.CHARTS, Tab.AUTOMOD, Tab.BLOCKEDTERMS, Tab.MESSAGEHISTORY, Tab.MANAGEMENT],
};

export function hasAccess(userRole: UserRole | null, section: Tab): boolean {
  if (!userRole) return false;
  const allowedSections = ROLE_PERMISSIONS[userRole];
  return allowedSections?.includes(section) ?? false;
}
