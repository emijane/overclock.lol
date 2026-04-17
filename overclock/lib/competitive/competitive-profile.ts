import {
  isCompetitiveRankTier,
  isCompetitiveRole,
  type CompetitiveProfile,
  type CompetitiveRoleProfile,
} from "@/lib/competitive/competitive-profile-types";
import { createClient } from "@/lib/supabase/server";

function normalizeCompetitiveRoleProfile(
  row: Record<string, unknown>
): CompetitiveRoleProfile | null {
  const role = typeof row.role === "string" ? row.role : "";
  const rankTier = typeof row.rank_tier === "string" ? row.rank_tier : "";

  if (!isCompetitiveRole(role) || !isCompetitiveRankTier(rankTier)) {
    return null;
  }

  return {
    id: typeof row.id === "string" ? row.id : "",
    profileId: typeof row.profile_id === "string" ? row.profile_id : "",
    role,
    rankTier,
    rankDivision:
      typeof row.rank_division === "number" ? row.rank_division : null,
    enabled: row.enabled === true,
    createdAt: typeof row.created_at === "string" ? row.created_at : "",
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : "",
  };
}

export async function getCompetitiveProfile(
  profileId: string
): Promise<CompetitiveProfile> {
  const supabase = await createClient();

  const { data: profileData, error: profileError } = await supabase
    .from("competitive_profiles")
    .select("main_role")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  const { data: roleData, error: roleError } = await supabase
    .from("competitive_role_profiles")
    .select(
      "id, profile_id, role, rank_tier, rank_division, enabled, created_at, updated_at"
    )
    .eq("profile_id", profileId)
    .order("role", { ascending: true });

  if (roleError) {
    throw roleError;
  }

  const rawMainRole =
    profileData && typeof profileData.main_role === "string"
      ? profileData.main_role
      : null;

  return {
    profileId,
    mainRole: rawMainRole && isCompetitiveRole(rawMainRole) ? rawMainRole : null,
    roles: (roleData ?? [])
      .map((row) => normalizeCompetitiveRoleProfile(row))
      .filter((role): role is CompetitiveRoleProfile => Boolean(role)),
  };
}
