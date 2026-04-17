import { getRankIconSrc } from "./rank-icons";
import { COMPETITIVE_ROLE_LABELS } from "@/lib/competitive/competitive-role-labels";
import type {
  CompetitiveProfile,
  CompetitiveRoleProfile,
} from "@/lib/competitive/competitive-profile-types";
import { formatCurrentRank } from "@/lib/profiles/profile-editor";

type RankFields = {
  current_rank_tier: string | null;
  current_rank_division: number | null;
};

export function getCurrentRankDisplay(profile: RankFields) {
  const currentRank =
    profile.current_rank_tier && profile.current_rank_tier !== "Unranked"
      ? `${profile.current_rank_tier} ${profile.current_rank_division ?? ""}`.trim()
      : profile.current_rank_tier;

  return {
    currentRank,
    currentRankIconSrc: getRankIconSrc(profile.current_rank_tier),
    currentRankPill: currentRank ?? "Unranked",
  };
}

export function getCompetitiveRankDisplay(
  fallbackProfile: RankFields,
  competitiveProfile: CompetitiveProfile
) {
  const mainRoleProfile = competitiveProfile.roles.find(
    (roleProfile) => roleProfile.role === competitiveProfile.mainRole
  );

  if (!mainRoleProfile) {
    return getCurrentRankDisplay(fallbackProfile);
  }

  const currentRank = formatCompetitiveRoleRank(mainRoleProfile);

  return {
    currentRank,
    currentRankIconSrc: getRankIconSrc(mainRoleProfile.rankTier),
    currentRankPill: `${currentRank} ${COMPETITIVE_ROLE_LABELS[mainRoleProfile.role]}`,
  };
}

function formatCompetitiveRoleRank(roleProfile: CompetitiveRoleProfile) {
  return formatCurrentRank(roleProfile.rankTier, roleProfile.rankDivision);
}
