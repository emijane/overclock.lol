import type { CompetitiveRole } from "@/lib/competitive/competitive-profile-types";
import type { ProfileBadge } from "@/lib/badges/badge-types";
import { getProfileBadges } from "@/lib/badges/badges";
import { createClient } from "@/lib/supabase/server";

import type {
  CompetitiveProfileSnapshot,
  LFGHeroSnapshot,
  LFGPost,
  LFGPostStatus,
  LFGType,
} from "./lfg-post-types";

function normalizeBadgeDefinition(value: unknown): ProfileBadge | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const candidate = value as Record<string, unknown>;

  if (
    typeof candidate.id !== "string" ||
    typeof candidate.slug !== "string" ||
    typeof candidate.label !== "string"
  ) {
    return null;
  }

  return {
    color: typeof candidate.color === "string" ? candidate.color : null,
    description:
      typeof candidate.description === "string" ? candidate.description : null,
    grantedAt:
      typeof candidate.granted_at === "string" ? candidate.granted_at : null,
    icon: typeof candidate.icon === "string" ? candidate.icon : null,
    id: candidate.id,
    label: candidate.label,
    slug: candidate.slug,
  };
}

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

function normalizeAuthor(value: unknown, badges: ProfileBadge[]) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      avatarUrl: null,
      badges,
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
    badges,
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

  const profileIds = Array.from(
    new Set(
      (data ?? [])
        .map((row) => (typeof row.profile_id === "string" ? row.profile_id : null))
        .filter((profileId): profileId is string => Boolean(profileId))
    )
  );
  const badgesByProfileId = new Map<string, ProfileBadge[]>();

  if (profileIds.length > 0) {
    const { data: badgeRows, error: badgeError } = await supabase
      .from("profile_badges")
      .select(
        "profile_id,granted_at,badge:badge_id(id,slug,label,description,icon,color)"
      )
      .in("profile_id", profileIds)
      .order("granted_at", { ascending: true });

    if (badgeError) {
      throw badgeError;
    }

    for (const row of badgeRows ?? []) {
      if (typeof row.profile_id !== "string") {
        continue;
      }

      const badge = normalizeBadgeDefinition({
        ...(row.badge && typeof row.badge === "object" && !Array.isArray(row.badge)
          ? (row.badge as Record<string, unknown>)
          : {}),
        granted_at: row.granted_at,
      });

      if (!badge) {
        continue;
      }

      const existingBadges = badgesByProfileId.get(row.profile_id) ?? [];
      existingBadges.push(badge);
      badgesByProfileId.set(row.profile_id, existingBadges);
    }
  }

  return (data ?? []).map((row) => ({
    author: normalizeAuthor(
      row.profiles,
      typeof row.profile_id === "string"
        ? badgesByProfileId.get(row.profile_id) ?? []
        : []
    ),
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

export async function getRecentPostsByProfileId(
  profileId: string,
  limit = 2
): Promise<LFGPost[]> {
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
    .eq("profile_id", profileId)
    .neq("status", "archived")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  const profileBadges = await getProfileBadges(profileId);

  return (data ?? []).map((row) => ({
    author: normalizeAuthor(row.profiles, profileBadges),
    createdAt: typeof row.created_at === "string" ? row.created_at : "",
    heroPool: normalizeHeroPoolSnapshot(row.hero_pool_snapshot),
    id: typeof row.id === "string" ? row.id : "",
    lfgType:
      row.lfg_type === "duos" ||
      row.lfg_type === "stacks" ||
      row.lfg_type === "scrims" ||
      row.lfg_type === "teams"
        ? row.lfg_type
        : "duos",
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
