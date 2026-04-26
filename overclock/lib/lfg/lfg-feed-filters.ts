import type { CompetitiveRole } from "@/lib/competitive/competitive-profile-types";
import { isCompetitiveRole } from "@/lib/competitive/competitive-profile-types";
import { REGION_OPTIONS } from "@/lib/profiles/profile-options";
import { isLFGGameMode, type LFGGameMode } from "./lfg-post-types";

export const LFG_REGION_OPTIONS = REGION_OPTIONS;
export const LFG_RANK_BRACKET_OPTIONS = [
  "bronze-silver",
  "gold-plat",
  "diamond-master",
  "gm-champion",
] as const;

export type LFGRankBracket = (typeof LFG_RANK_BRACKET_OPTIONS)[number];
export type LFGRegion = (typeof REGION_OPTIONS)[number];

export type LFGFeedFilters = {
  mode?: LFGGameMode;
  rank?: LFGRankBracket;
  region?: LFGRegion;
  role?: CompetitiveRole;
};

export function isLFGRankBracket(value: string): value is LFGRankBracket {
  return LFG_RANK_BRACKET_OPTIONS.includes(value as LFGRankBracket);
}

export function isLFGRegion(value: string): value is LFGRegion {
  return REGION_OPTIONS.includes(value as LFGRegion);
}

export function parseLFGFeedFilters(input: {
  mode?: string;
  rank?: string;
  region?: string;
  role?: string;
}): LFGFeedFilters {
  return {
    mode: input.mode && isLFGGameMode(input.mode) ? input.mode : undefined,
    rank: input.rank && isLFGRankBracket(input.rank) ? input.rank : undefined,
    region: input.region && isLFGRegion(input.region) ? input.region : undefined,
    role: input.role && isCompetitiveRole(input.role) ? input.role : undefined,
  };
}

export function getRankBracketTiers(rankBracket: LFGRankBracket) {
  if (rankBracket === "bronze-silver") {
    return ["Bronze", "Silver"];
  }

  if (rankBracket === "gold-plat") {
    return ["Gold", "Platinum"];
  }

  if (rankBracket === "diamond-master") {
    return ["Diamond", "Master"];
  }

  return ["Grandmaster", "Champion"];
}

export function getRankBracketLabel(rankBracket: LFGRankBracket) {
  if (rankBracket === "bronze-silver") {
    return "Bronze-Silver";
  }

  if (rankBracket === "gold-plat") {
    return "Gold-Plat";
  }

  if (rankBracket === "diamond-master") {
    return "Diamond-Master";
  }

  return "GM-Champion";
}
