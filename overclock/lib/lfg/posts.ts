import type { CompetitiveRole } from "@/lib/competitive/competitive-profile-types";
import type { ProfileBadge } from "@/lib/badges/badge-types";
import { getProfileBadges } from "@/lib/badges/badges";
import { createClient } from "@/lib/supabase/server";
import { getRankBracketTiers, type LFGFeedFilters } from "./lfg-feed-filters";
import { ACTIVE_LFG_POST_WINDOW_HOURS } from "./lfg-post-policy";
import { normalizeLFGPostTitleForComparison } from "./lfg-post-title";
import {
  isLFGGameMode,
  isLFGType,
  normalizeLFGLookingForRoles,
} from "./lfg-post-types";

import type {
  CompetitiveProfileSnapshot,
  LFGGameMode,
  LFGHeroSnapshot,
  LFGPost,
  LFGPostStatus,
  LFGType,
} from "./lfg-post-types";

export type ActiveLFGPostCountsByRole = Record<CompetitiveRole, number>;

function getActivePostCutoffIso(now = new Date()) {
  return new Date(
    now.getTime() - ACTIVE_LFG_POST_WINDOW_HOURS * 60 * 60 * 1000
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

function normalizeLFGGameMode(value: unknown): LFGGameMode {
  return typeof value === "string" && isLFGGameMode(value) ? value : "ranked";
}

function normalizeLookingForRoles(value: unknown) {
  if (!Array.isArray(value)) {
    return normalizeLFGLookingForRoles([]);
  }

  return normalizeLFGLookingForRoles(
    value.filter((role): role is string => typeof role === "string")
  );
}

function createEmptyRoleCountMap(): ActiveLFGPostCountsByRole {
  return {
    tank: 0,
    dps: 0,
    support: 0,
  };
}

function normalizeLFGPostRow(
  row: Record<string, unknown>,
  badges: ProfileBadge[]
): LFGPost {
  return {
    author: normalizeAuthor(row.profiles, badges),
    createdAt: typeof row.created_at === "string" ? row.created_at : "",
    gameMode: normalizeLFGGameMode(row.game_mode),
    heroPool: normalizeHeroPoolSnapshot(row.hero_pool_snapshot),
    id: typeof row.id === "string" ? row.id : "",
    lfgType: normalizeLFGType(row.lfg_type),
    lookingForRoles: normalizeLookingForRoles(row.looking_for_roles),
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

export async function getActiveLFGPosts(
  lfgType: LFGType,
  filters?: LFGFeedFilters
): Promise<LFGPost[]> {
  const supabase = await createClient();
  const activePostCutoffIso = getActivePostCutoffIso();
  let query = supabase
    .from("lfg_posts")
    .select(
      [
        "id",
        "profile_id",
        "lfg_type",
        "game_mode",
        "title",
        "status",
        "looking_for_roles",
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
    .order("created_at", { ascending: false });

  if (filters?.role) {
    query = query.eq("posting_role", filters.role);
  }

  if (filters?.lookingFor) {
    query = query.contains("looking_for_roles", [filters.lookingFor]);
  }

  if (filters?.mode) {
    query = query.eq("game_mode", filters.mode);
  }

  if (filters?.region) {
    query = query.eq("snapshot_region", filters.region);
  }

  if (filters?.rank) {
    query = query.in("snapshot_rank_tier", getRankBracketTiers(filters.rank));
  }

  const { data, error } = await query.limit(30);

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
        "game_mode",
        "title",
        "status",
        "looking_for_roles",
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
        "game_mode",
        "title",
        "status",
        "looking_for_roles",
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

export async function getActiveLFGPostCountsByRole(input: {
  lfgType: LFGType;
  profileId: string;
}): Promise<ActiveLFGPostCountsByRole> {
  const supabase = await createClient();
  const activePostCutoffIso = getActivePostCutoffIso();
  const { data, error } = await supabase
    .from("lfg_posts")
    .select("posting_role")
    .eq("profile_id", input.profileId)
    .eq("lfg_type", input.lfgType)
    .eq("status", "active")
    .gte("created_at", activePostCutoffIso);

  if (error) {
    throw error;
  }

  const counts = createEmptyRoleCountMap();

  for (const row of (data ?? []) as Array<Record<string, unknown>>) {
    const postingRole = row.posting_role;

    if (
      postingRole === "tank" ||
      postingRole === "dps" ||
      postingRole === "support"
    ) {
      counts[postingRole] += 1;
    }
  }

  return counts;
}

function normalizeLFGCreateResult(value: unknown): {
  created: boolean;
  errorCode: string | null;
  postId: string | null;
} {
  if (typeof value === "string") {
    try {
      return normalizeLFGCreateResult(JSON.parse(value));
    } catch {
      return {
        created: false,
        errorCode: "invalid_response",
        postId: null,
      };
    }
  }

  if (Array.isArray(value)) {
    return value.length > 0
      ? normalizeLFGCreateResult(value[0])
      : {
          created: false,
          errorCode: "invalid_response",
          postId: null,
        };
  }

  if (!value || typeof value !== "object") {
    return {
      created: false,
      errorCode: "invalid_response",
      postId: null,
    };
  }

  const candidate = value as Record<string, unknown>;
  const nestedCandidate =
    candidate.create_lfg_post_atomic &&
    typeof candidate.create_lfg_post_atomic === "object" &&
    !Array.isArray(candidate.create_lfg_post_atomic)
      ? (candidate.create_lfg_post_atomic as Record<string, unknown>)
      : candidate;

  return {
    created: nestedCandidate.created === true,
    errorCode:
      typeof nestedCandidate.error_code === "string"
        ? nestedCandidate.error_code
        : null,
    postId:
      typeof nestedCandidate.post_id === "string" ? nestedCandidate.post_id : null,
  };
}

function normalizeLFGCloseResult(value: unknown): {
  errorCode: string | null;
  lfgType: LFGType | null;
  updated: boolean;
} {
  if (typeof value === "string") {
    try {
      return normalizeLFGCloseResult(JSON.parse(value));
    } catch {
      return {
        errorCode: "invalid_response",
        lfgType: null,
        updated: false,
      };
    }
  }

  if (Array.isArray(value)) {
    return value.length > 0
      ? normalizeLFGCloseResult(value[0])
      : {
          errorCode: "invalid_response",
          lfgType: null,
          updated: false,
        };
  }

  if (!value || typeof value !== "object") {
    return {
      errorCode: "invalid_response",
      lfgType: null,
      updated: false,
    };
  }

  const candidate = value as Record<string, unknown>;
  const nestedCandidate =
    candidate.close_owned_lfg_post &&
    typeof candidate.close_owned_lfg_post === "object" &&
    !Array.isArray(candidate.close_owned_lfg_post)
      ? (candidate.close_owned_lfg_post as Record<string, unknown>)
      : candidate;

  return {
    errorCode:
      typeof nestedCandidate.error_code === "string"
        ? nestedCandidate.error_code
        : null,
    lfgType:
      typeof nestedCandidate.lfg_type === "string" && isLFGType(nestedCandidate.lfg_type)
        ? nestedCandidate.lfg_type
        : null,
    updated: nestedCandidate.updated === true,
  };
}

export async function createLFGPostAtomically(input: {
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
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_lfg_post_atomic", {
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
  });

  if (error) {
    throw error;
  }

  return normalizeLFGCreateResult(data);
}

export async function hasMatchingActiveLFGPost(input: {
  gameMode: LFGGameMode;
  lfgType: LFGType;
  postingRole: CompetitiveRole;
  profileId: string;
  title: string;
}) {
  const supabase = await createClient();
  const activePostCutoffIso = getActivePostCutoffIso();
  const { data, error } = await supabase
    .from("lfg_posts")
    .select("id,title")
    .eq("profile_id", input.profileId)
    .eq("game_mode", input.gameMode)
    .eq("lfg_type", input.lfgType)
    .eq("posting_role", input.postingRole)
    .eq("status", "active")
    .gte("created_at", activePostCutoffIso)
    .limit(20);

  if (error) {
    throw error;
  }

  const normalizedTitle = normalizeLFGPostTitleForComparison(input.title);

  return ((data ?? []) as Array<Record<string, unknown>>).some((row) => {
    return (
      typeof row.title === "string" &&
      normalizeLFGPostTitleForComparison(row.title) === normalizedTitle
    );
  });
}

export async function hasReachedActiveLFGPostLimit(input: {
  lfgType: LFGType;
  postingRole: CompetitiveRole;
  profileId: string;
}) {
  const supabase = await createClient();
  const activePostCutoffIso = getActivePostCutoffIso();
  const { count, error } = await supabase
    .from("lfg_posts")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", input.profileId)
    .eq("lfg_type", input.lfgType)
    .eq("posting_role", input.postingRole)
    .eq("status", "active")
    .gte("created_at", activePostCutoffIso);

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

export async function closeOwnedActiveLFGPost(input: {
  postId: string;
  profileId: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("close_owned_lfg_post", {
    p_post_id: input.postId,
  });

  if (error) {
    throw error;
  }

  return normalizeLFGCloseResult(data);
}
