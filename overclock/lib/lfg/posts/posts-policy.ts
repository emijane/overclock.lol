import type { CompetitiveRole } from "@/lib/competitive/competitive-profile-types";
import { createClient } from "@/lib/supabase/server";

import type { LFGType } from "../lfg-post-types";

export type ActiveLFGPostCountsByRole = Record<CompetitiveRole, number>;

export function createEmptyRoleCountMap(): ActiveLFGPostCountsByRole {
  return {
    tank: 0,
    dps: 0,
    support: 0,
  };
}

export async function hasReachedActiveLFGPostLimit(input: {
  lfgType: LFGType;
  postingRole: CompetitiveRole;
  profileId: string;
}) {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("lfg_posts")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", input.profileId)
    .eq("lfg_type", input.lfgType)
    .eq("posting_role", input.postingRole)
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString());

  if (error) {
    throw error;
  }

  return (count ?? 0) >= 2;
}

export async function hasReachedLFGPostCreationLimit(input: {
  lfgType: LFGType;
  profileId: string;
}) {
  const supabase = await createClient();
  const postCreationCutoffIso = new Date(
    Date.now() - 60 * 60 * 1000
  ).toISOString();
  const { count, error } = await supabase
    .from("lfg_posts")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", input.profileId)
    .eq("lfg_type", input.lfgType)
    .gte("created_at", postCreationCutoffIso);

  if (error) {
    throw error;
  }

  return (count ?? 0) >= 4;
}
