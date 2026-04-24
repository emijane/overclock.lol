import type { CompetitiveRole } from "@/lib/competitive/competitive-profile-types";
import type { ProfileBadge } from "@/lib/badges/badge-types";
import { getProfileBadges } from "@/lib/badges/badges";
import { createClient } from "@/lib/supabase/server";
import {
  ACTIVE_LFG_POST_WINDOW_HOURS,
  LFG_POST_RATE_LIMIT_MAX_POSTS,
  LFG_POST_RATE_LIMIT_WINDOW_MINUTES,
} from "./lfg-post-policy";
import { isLFGType } from "./lfg-post-types";

import type {
  CompetitiveProfileSnapshot,
  LFGHeroSnapshot,
  LFGPost,
  LFGPostStatus,
  LFGType,
} from "./lfg-post-types";

function getActivePostCutoffIso(now = new Date()) {
  return new Date(
    now.getTime() - ACTIVE_LFG_POST_WINDOW_HOURS * 60 * 60 * 1000
  ).toISOString();
}

function getRateLimitCutoffIso(now = new Date()) {
  return new Date(
    now.getTime() - LFG_POST_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000
  ).toISOString();
}

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

  const snapshots: LFGHeroSnapshot[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      continue;
    }

    const candidate = item as Record<string, unknown>;

    if (typeof candidate.id !== "string" || typeof candidate.label !== "string") {
      continue;
    }

    snapshots.push({
      id: candidate.id,
      imageSrc:
        typeof candidate.imageSrc === "string" ? candidate.imageSrc : null,
      label: candidate.label,
    });
  }

  return snapshots;
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

function normalizeCompetitiveRole(value: unknown): CompetitiveRole {
  return value === "tank" || value === "dps" || value === "support"
    ? value
    : "support";
}

function normalizeLFGType(value: unknown): LFGType {
  return typeof value === "string" && isLFGType(value) ? value : "duos";
}

function normalizeLFGPostRow(
  row: Record<string, unknown>,
  badges: ProfileBadge[]
): LFGPost {
  return {
    author: normalizeAuthor(row.profiles, badges),
    createdAt: typeof row.created_at === "string" ? row.created_at : "",
    heroPool: normalizeHeroPoolSnapshot(row.hero_pool_snapshot),
    id: typeof row.id === "string" ? row.id : "",
    lfgType: normalizeLFGType(row.lfg_type),
    profileId: typeof row.profile_id === "string" ? row.profile_id : null,
    postingRole: normalizeCompetitiveRole(row.posting_role),
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
  };
}

export async function getActiveLFGPosts(lfgType: LFGType): Promise<LFGPost[]> {
  const supabase = await createClient();
  const activePostCutoffIso = getActivePostCutoffIso();
  const { data, error } = await supabase
    .from("lfg_posts")
    .select(
      [
        "id",
        "profile_id",
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
    .gte("created_at", activePostCutoffIso)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    throw error;
  }

  const postRows = ((data ?? []) as unknown) as Array<Record<string, unknown>>;

  const profileIds = Array.from(
    new Set(
      postRows
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

    for (const row of (badgeRows ?? []) as Array<Record<string, unknown>>) {
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

  return postRows.map((row) =>
    normalizeLFGPostRow(
      row,
      typeof row.profile_id === "string"
        ? badgesByProfileId.get(row.profile_id) ?? []
        : []
    )
  );
}

export async function getRecentPostsByProfileId(
  profileId: string,
  limit = 2
): Promise<LFGPost[]> {
  const supabase = await createClient();
  const activePostCutoffIso = getActivePostCutoffIso();
  const { data, error } = await supabase
    .from("lfg_posts")
    .select(
      [
        "id",
        "profile_id",
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
    .eq("status", "active")
    .gte("created_at", activePostCutoffIso)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  const profileBadges = await getProfileBadges(profileId);
  const postRows = ((data ?? []) as unknown) as Array<Record<string, unknown>>;

  return postRows.map((row) => normalizeLFGPostRow(row, profileBadges));
}

export async function getPostsByProfileId(
  profileId: string,
  limit = 30
): Promise<LFGPost[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lfg_posts")
    .select(
      [
        "id",
        "profile_id",
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
  const postRows = ((data ?? []) as unknown) as Array<Record<string, unknown>>;

  return postRows.map((row) => normalizeLFGPostRow(row, profileBadges));
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

export async function hasMatchingActiveLFGPost(input: {
  lfgType: LFGType;
  postingRole: CompetitiveRole;
  profileId: string;
  title: string;
}) {
  const supabase = await createClient();
  const activePostCutoffIso = getActivePostCutoffIso();
  const { data, error } = await supabase
    .from("lfg_posts")
    .select("id")
    .eq("profile_id", input.profileId)
    .eq("lfg_type", input.lfgType)
    .eq("posting_role", input.postingRole)
    .eq("title", input.title)
    .eq("status", "active")
    .gte("created_at", activePostCutoffIso)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data?.id);
}

export async function hasReachedLFGPostRateLimit(input: {
  lfgType: LFGType;
  profileId: string;
}) {
  const supabase = await createClient();
  const rateLimitCutoffIso = getRateLimitCutoffIso();
  const { count, error } = await supabase
    .from("lfg_posts")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", input.profileId)
    .eq("lfg_type", input.lfgType)
    .gte("created_at", rateLimitCutoffIso);

  if (error) {
    throw error;
  }

  return (count ?? 0) >= LFG_POST_RATE_LIMIT_MAX_POSTS;
}

export async function closeOwnedActiveLFGPost(input: {
  postId: string;
  profileId: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lfg_posts")
    .update({ status: "closed" })
    .eq("id", input.postId)
    .eq("profile_id", input.profileId)
    .eq("status", "active")
    .select("lfg_type")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return {
    lfgType:
      typeof data?.lfg_type === "string" && isLFGType(data.lfg_type)
        ? data.lfg_type
        : null,
    updated: Boolean(data),
  };
}
