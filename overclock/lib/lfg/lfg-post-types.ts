import type { CompetitiveRole } from "@/lib/competitive/competitive-profile-types";
import type { ProfileBadge } from "@/lib/badges/badge-types";
import { COMPETITIVE_ROLE_OPTIONS } from "@/lib/competitive/competitive-profile-types";

export const LFG_TYPE_OPTIONS = ["duos", "stacks", "scrims", "teams"] as const;
export type LFGType = (typeof LFG_TYPE_OPTIONS)[number];

export const SHIPPED_LFG_TYPES = ["duos", "stacks"] as const;
export type ShippedLFGType = (typeof SHIPPED_LFG_TYPES)[number];

export const LFG_POST_TITLE_MAX_CHARACTERS = 80;

export const LFG_POST_STATUS_OPTIONS = [
  "active",
  "filled",
  "closed",
  "expired",
  "archived",
] as const;
export type LFGPostStatus = (typeof LFG_POST_STATUS_OPTIONS)[number];

export const LFG_GAME_MODE_OPTIONS = ["ranked", "quick_play"] as const;
export type LFGGameMode = (typeof LFG_GAME_MODE_OPTIONS)[number];
export type LFGLookingForRole = CompetitiveRole;

export type LFGHeroSnapshot = {
  id: string;
  imageSrc?: string | null;
  label: string;
};

export type CompetitiveProfileSnapshot = {
  hero_pool: LFGHeroSnapshot[];
  main_role: CompetitiveRole | null;
  platform: string | null;
  posting_role: CompetitiveRole;
  rank_division: number | null;
  rank_tier: string;
  region: string | null;
  timezone: string | null;
};

export type StackMember = {
  avatarUrl: string | null;
  displayName: string | null;
  isOwner: boolean;
  profileId: string;
  role: CompetitiveRole;
  username: string | null;
};

export type LFGPost = {
  author: {
    avatarUrl: string | null;
    badges: ProfileBadge[];
    coverImageUrl: string | null;
    displayName: string | null;
    hideOfflinePresence: boolean;
    isLookingToPlay: boolean;
    lastSeenAt: string | null;
    username: string | null;
  };
  createdAt: string;
  currentMemberCount: number;
  description: string | null;
  gameMode: LFGGameMode;
  heroPool: LFGHeroSnapshot[];
  id: string;
  lfgType: LFGType;
  lookingForRoles: LFGLookingForRole[];
  maxGroupSize: number | null;
  profileId: string | null;
  postingRole: CompetitiveRole;
  platform: string | null;
  rankDivision: number | null;
  rankTier: string;
  region: string | null;
  stackMembers: StackMember[];
  status: LFGPostStatus;
  timezone: string | null;
  title: string;
};

export function isLFGLookingForRole(value: string): value is LFGLookingForRole {
  return COMPETITIVE_ROLE_OPTIONS.includes(value as LFGLookingForRole);
}

export function normalizeLFGLookingForRoles(
  values: Iterable<string>
): LFGLookingForRole[] {
  const uniqueRoles = Array.from(
    new Set(
      Array.from(values).filter((value): value is LFGLookingForRole =>
        isLFGLookingForRole(value)
      )
    )
  );

  if (uniqueRoles.length === 0 || uniqueRoles.length === COMPETITIVE_ROLE_OPTIONS.length) {
    return [...COMPETITIVE_ROLE_OPTIONS];
  }

  return uniqueRoles;
}

export function getLFGLookingForRoleLabel(role: LFGLookingForRole) {
  if (role === "tank") {
    return "Tank";
  }

  if (role === "dps") {
    return "DPS";
  }

  return "Support";
}

export function isLFGType(value: string): value is LFGType {
  return LFG_TYPE_OPTIONS.includes(value as LFGType);
}

export function isShippedLFGType(value: string): value is ShippedLFGType {
  return SHIPPED_LFG_TYPES.includes(value as ShippedLFGType);
}

export function isLFGGameMode(value: string): value is LFGGameMode {
  return LFG_GAME_MODE_OPTIONS.includes(value as LFGGameMode);
}

export function getLFGGameModeLabel(gameMode: LFGGameMode) {
  return gameMode === "quick_play" ? "Quick Play" : "Competitive";
}
