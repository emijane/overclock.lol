import type { CompetitiveRole } from "@/lib/competitive/competitive-profile-types";
import { isCompetitiveRole } from "@/lib/competitive/competitive-profile-types";
import { RANK_TIERS, REGION_OPTIONS } from "@/lib/profiles/profile-options";
import { isLFGGameMode, type LFGGameMode } from "./lfg-post-types";

export const LFG_REGION_OPTIONS = REGION_OPTIONS;
export const LFG_RANK_FILTER_OPTIONS = RANK_TIERS.filter(
  (tier) => tier !== "Unranked"
);

export type LFGRankFilterOption = (typeof LFG_RANK_FILTER_OPTIONS)[number];
export type LFGRegion = (typeof REGION_OPTIONS)[number];

export type LFGFeedFilters = {
  lookingFor?: CompetitiveRole;
  maxRank?: LFGRankFilterOption;
  minRank?: LFGRankFilterOption;
  mode?: LFGGameMode;
  region?: LFGRegion;
  role?: CompetitiveRole;
};

export function isLFGRankFilterOption(value: string): value is LFGRankFilterOption {
  return LFG_RANK_FILTER_OPTIONS.includes(value as LFGRankFilterOption);
}

export function isLFGRegion(value: string): value is LFGRegion {
  return REGION_OPTIONS.includes(value as LFGRegion);
}

function getRankOrderIndex(rank: LFGRankFilterOption) {
  return LFG_RANK_FILTER_OPTIONS.indexOf(rank);
}

function normalizeRankBounds(input: {
  maxRank?: LFGRankFilterOption;
  minRank?: LFGRankFilterOption;
}) {
  const { maxRank, minRank } = input;

  if (!minRank || !maxRank) {
    return { maxRank, minRank };
  }

  return getRankOrderIndex(minRank) <= getRankOrderIndex(maxRank)
    ? { maxRank, minRank }
    : { maxRank: minRank, minRank: maxRank };
}

export function parseLFGFeedFilters(input: {
  lookingFor?: string;
  maxRank?: string;
  minRank?: string;
  mode?: string;
  region?: string;
  role?: string;
}): LFGFeedFilters {
  const parsedMinRank =
    input.minRank && isLFGRankFilterOption(input.minRank) ? input.minRank : undefined;
  const parsedMaxRank =
    input.maxRank && isLFGRankFilterOption(input.maxRank) ? input.maxRank : undefined;
  const normalizedRankBounds = normalizeRankBounds({
    maxRank: parsedMaxRank,
    minRank: parsedMinRank,
  });

  return {
    lookingFor:
      input.lookingFor && isCompetitiveRole(input.lookingFor)
        ? input.lookingFor
        : undefined,
    maxRank: normalizedRankBounds.maxRank,
    minRank: normalizedRankBounds.minRank,
    mode: input.mode && isLFGGameMode(input.mode) ? input.mode : undefined,
    region: input.region && isLFGRegion(input.region) ? input.region : undefined,
    role: input.role && isCompetitiveRole(input.role) ? input.role : undefined,
  };
}

export function getLFGRankRangeTiers(input: {
  maxRank?: LFGRankFilterOption;
  minRank?: LFGRankFilterOption;
}) {
  const normalizedRankBounds = normalizeRankBounds(input);
  const minRankIndex = normalizedRankBounds.minRank
    ? getRankOrderIndex(normalizedRankBounds.minRank)
    : 0;
  const maxRankIndex = normalizedRankBounds.maxRank
    ? getRankOrderIndex(normalizedRankBounds.maxRank)
    : LFG_RANK_FILTER_OPTIONS.length - 1;

  return LFG_RANK_FILTER_OPTIONS.slice(minRankIndex, maxRankIndex + 1);
}
