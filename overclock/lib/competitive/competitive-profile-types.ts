import {
  PLATFORM_OPTIONS,
  RANK_TIERS,
} from "@/lib/profiles/profile-options";

export const COMPETITIVE_ROLE_OPTIONS = ["tank", "dps", "support"] as const;

export type CompetitiveRole = (typeof COMPETITIVE_ROLE_OPTIONS)[number];
export type CompetitiveRankTier = (typeof RANK_TIERS)[number];
export type CompetitivePlatform = (typeof PLATFORM_OPTIONS)[number];

export type CompetitiveRoleProfile = {
  id: string;
  profileId: string;
  role: CompetitiveRole;
  rankTier: CompetitiveRankTier;
  rankDivision: number | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CompetitiveProfile = {
  profileId: string;
  mainRole: CompetitiveRole | null;
  platform: CompetitivePlatform | null;
  roles: CompetitiveRoleProfile[];
};

export function isCompetitiveRole(value: string): value is CompetitiveRole {
  return COMPETITIVE_ROLE_OPTIONS.includes(value as CompetitiveRole);
}

export function isCompetitiveRankTier(value: string): value is CompetitiveRankTier {
  return RANK_TIERS.includes(value as CompetitiveRankTier);
}

export function isCompetitivePlatform(value: string): value is CompetitivePlatform {
  return PLATFORM_OPTIONS.includes(value as CompetitivePlatform);
}
