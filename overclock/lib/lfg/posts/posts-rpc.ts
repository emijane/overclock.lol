import type { CompetitiveRole } from "@/lib/competitive/competitive-profile-types";
import { createClient } from "@/lib/supabase/server";

import { STACK_MAX_GROUP_SIZE } from "../lfg-post-policy";
import type {
  CompetitiveProfileSnapshot,
  LFGGameMode,
  LFGHeroSnapshot,
  LFGType,
} from "../lfg-post-types";
import { normalizeLFGCreateResult } from "./post-normalization";

export type CreateLFGPostInput = {
  competitiveProfileSnapshot: CompetitiveProfileSnapshot;
  gameMode: LFGGameMode;
  heroPoolSnapshot: LFGHeroSnapshot[];
  lfgType: LFGType;
  lookingForRoles: CompetitiveRole[];
  platform: string | null;
  postingRole: CompetitiveRole;
  profileId: string;
  rankDivision: number | null;
  rankTier: string;
  region: string | null;
  timezone: string | null;
  title: string;
};

function getErrorText(error: unknown) {
  if (!error || typeof error !== "object") {
    return "";
  }

  const candidate = error as Record<string, unknown>;

  return [
    typeof candidate.code === "string" ? candidate.code : "",
    typeof candidate.message === "string" ? candidate.message : "",
    typeof candidate.details === "string" ? candidate.details : "",
    typeof candidate.hint === "string" ? candidate.hint : "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function isLegacyCreateLFGPostRpcError(error: unknown) {
  const text = getErrorText(error);

  return (
    text.includes("create_lfg_post_atomic") &&
    (text.includes("pgrst") ||
      text.includes("could not find") ||
      text.includes("does not exist") ||
      text.includes("not found"))
  );
}

export async function tryCreateLFGPostAtomicVariants(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: CreateLFGPostInput
) {
  const rpcVariants = [
    {
      p_competitive_profile_snapshot: input.competitiveProfileSnapshot,
      p_game_mode: input.gameMode,
      p_hero_pool_snapshot: input.heroPoolSnapshot,
      p_lfg_type: input.lfgType,
      p_looking_for_roles: input.lookingForRoles,
      p_platform: input.platform,
      p_posting_role: input.postingRole,
      p_profile_id: input.profileId,
      p_rank_division: input.rankDivision,
      p_rank_tier: input.rankTier,
      p_region: input.region,
      p_timezone: input.timezone,
      p_title: input.title,
    },
    {
      p_competitive_profile_snapshot: input.competitiveProfileSnapshot,
      p_game_mode: input.gameMode,
      p_hero_pool_snapshot: input.heroPoolSnapshot,
      p_lfg_type: input.lfgType,
      p_platform: input.platform,
      p_posting_role: input.postingRole,
      p_profile_id: input.profileId,
      p_rank_division: input.rankDivision,
      p_rank_tier: input.rankTier,
      p_region: input.region,
      p_timezone: input.timezone,
      p_title: input.title,
      p_max_group_size: input.lfgType === "stacks" ? STACK_MAX_GROUP_SIZE : null,
      p_description: null,
    },
    {
      p_competitive_profile_snapshot: input.competitiveProfileSnapshot,
      p_game_mode: input.gameMode,
      p_hero_pool_snapshot: input.heroPoolSnapshot,
      p_lfg_type: input.lfgType,
      p_looking_for_roles: input.lookingForRoles,
      p_platform: input.platform,
      p_posting_role: input.postingRole,
      p_profile_id: input.profileId,
      p_rank_division: input.rankDivision,
      p_rank_tier: input.rankTier,
      p_region: input.region,
      p_timezone: input.timezone,
      p_title: input.title,
    },
    {
      p_competitive_profile_snapshot: input.competitiveProfileSnapshot,
      p_game_mode: input.gameMode,
      p_hero_pool_snapshot: input.heroPoolSnapshot,
      p_lfg_type: input.lfgType,
      p_platform: input.platform,
      p_posting_role: input.postingRole,
      p_profile_id: input.profileId,
      p_rank_division: input.rankDivision,
      p_rank_tier: input.rankTier,
      p_region: input.region,
      p_timezone: input.timezone,
      p_title: input.title,
    },
  ];

  let lastError: unknown = null;

  for (const args of rpcVariants) {
    const { data, error } = await supabase.rpc("create_lfg_post_atomic", args);

    if (!error) {
      return normalizeLFGCreateResult(data);
    }

    lastError = error;

    if (!isLegacyCreateLFGPostRpcError(error)) {
      throw error;
    }
  }

  throw lastError;
}
