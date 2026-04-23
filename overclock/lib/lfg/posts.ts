import type { CompetitiveRole } from "@/lib/competitive/competitive-profile-types";
import { createClient } from "@/lib/supabase/server";

import type {
  CompetitiveProfileSnapshot,
  LFGHeroSnapshot,
  LFGPost,
  LFGPostStatus,
  LFGType,
} from "./lfg-post-types";

function normalizeHeroPoolSnapshot(value: unknown): LFGHeroSnapshot[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return null;
      }

      const candidate = item as Record<string, unknown>;

      if (typeof candidate.id !== "string" || typeof candidate.label !== "string") {
        return null;
      }

      return {
        id: candidate.id,
        imageSrc:
          typeof candidate.imageSrc === "string" ? candidate.imageSrc : null,
        label: candidate.label,
      } satisfies LFGHeroSnapshot;
    })
    .filter((hero): hero is LFGHeroSnapshot => Boolean(hero));
}

function normalizeStatus(value: unknown): LFGPostStatus {
  return value === "closed" || value === "archived" ? value : "active";
}

function normalizeAuthor(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      avatarUrl: null,
      displayName: null,
      username: null,
    };
  }

  const candidate = value as Record<string, unknown>;

  return {
    avatarUrl:
      typeof candidate.discord_avatar_url === "string"
        ? candidate.discord_avatar_url
        : null,
    displayName:
      typeof candidate.display_name === "string" ? candidate.display_name : null,
    username: typeof candidate.username === "string" ? candidate.username : null,
  };
}

export async function getActiveLFGPosts(lfgType: LFGType): Promise<LFGPost[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lfg_posts")
    .select(
      [
        "id",
        "lfg_type",
        "title",
        "status",
        "posting_role",
        "snapshot_rank_tier",
        "snapshot_rank_division",
        "snapshot_region",
        "snapshot_timezone",
        "hero_pool_snapshot",
        "created_at",
        "profiles:profile_id(username,display_name,discord_avatar_url)",
      ].join(",")
    )
    .eq("lfg_type", lfgType)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => ({
    author: normalizeAuthor(row.profiles),
    createdAt: typeof row.created_at === "string" ? row.created_at : "",
    heroPool: normalizeHeroPoolSnapshot(row.hero_pool_snapshot),
    id: typeof row.id === "string" ? row.id : "",
    lfgType: row.lfg_type === lfgType ? lfgType : lfgType,
    postingRole:
      row.posting_role === "tank" ||
      row.posting_role === "dps" ||
      row.posting_role === "support"
        ? (row.posting_role as CompetitiveRole)
        : "support",
    rankDivision:
      typeof row.snapshot_rank_division === "number"
        ? row.snapshot_rank_division
        : null,
    rankTier:
      typeof row.snapshot_rank_tier === "string"
        ? row.snapshot_rank_tier
        : "Unranked",
    region: typeof row.snapshot_region === "string" ? row.snapshot_region : null,
    status: normalizeStatus(row.status),
    timezone:
      typeof row.snapshot_timezone === "string" ? row.snapshot_timezone : null,
    title: typeof row.title === "string" ? row.title : "",
  }));
}

export async function insertLFGPost(input: {
  competitiveProfileSnapshot: CompetitiveProfileSnapshot;
  heroPoolSnapshot: LFGHeroSnapshot[];
  lfgType: LFGType;
  platform: string | null;
  postingRole: CompetitiveRole;
  profileId: string;
  rankDivision: number | null;
  rankTier: string;
  region: string | null;
  timezone: string | null;
  title: string;
}) {
  const supabase = await createClient();

  const { error } = await supabase.from("lfg_posts").insert({
    competitive_profile_snapshot: input.competitiveProfileSnapshot,
    hero_pool_snapshot: input.heroPoolSnapshot,
    lfg_type: input.lfgType,
    posting_role: input.postingRole,
    profile_id: input.profileId,
    snapshot_main_role: input.competitiveProfileSnapshot.main_role,
    snapshot_platform: input.platform,
    snapshot_rank_division: input.rankDivision,
    snapshot_rank_tier: input.rankTier,
    snapshot_region: input.region,
    snapshot_timezone: input.timezone,
    title: input.title,
  });

  if (error) {
    throw error;
  }
}
