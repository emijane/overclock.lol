import type { CompetitiveRole } from "@/lib/competitive/competitive-profile-types";

export const LFG_TYPE_OPTIONS = ["duos", "stacks", "scrims", "teams"] as const;
export type LFGType = (typeof LFG_TYPE_OPTIONS)[number];

export const LFG_POST_STATUS_OPTIONS = ["active", "closed", "archived"] as const;
export type LFGPostStatus = (typeof LFG_POST_STATUS_OPTIONS)[number];

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

export type LFGPost = {
  createdAt: string;
  heroPool: LFGHeroSnapshot[];
  id: string;
  lfgType: LFGType;
  postingRole: CompetitiveRole;
  rankDivision: number | null;
  rankTier: string;
  region: string | null;
  status: LFGPostStatus;
  timezone: string | null;
  title: string;
};

export function isLFGType(value: string): value is LFGType {
  return LFG_TYPE_OPTIONS.includes(value as LFGType);
}
