import { getRankIconSrc } from "./rank-icons";

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
