import type { CompetitiveRole } from "@/lib/competitive/competitive-profile-types";
import type { ProfileBadge } from "@/lib/badges/badge-types";
import { getProfileBadges } from "@/lib/badges/badges";
import { getBlockedProfileIdsForViewer } from "@/lib/blocks/user-blocks";
import { getProfileAvatarUrl, getProfileCoverUrl } from "@/lib/profiles/profile-media";
import { createClient } from "@/lib/supabase/server";
import { getLFGRankRangeTiers, type LFGFeedFilters } from "./lfg-feed-filters";
import {
  ACTIVE_LFG_POST_WINDOW_HOURS,
  STACK_MAX_GROUP_SIZE,
} from "./lfg-post-policy";
import { normalizeLFGPostTitleForComparison } from "./lfg-post-title";
import { expireStackPostsRecord } from "./stack-requests";
import { isMissingStackMembersSupportError } from "./stack-requests";
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
  StackMember,
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
  return value === "filled" ||
    value === "closed" ||
    value === "expired" ||
    value === "archived"
    ? value
    : "active";
}

function normalizeAuthor(value: unknown, badges: ProfileBadge[]) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      avatarUrl: null,
      badges,
      coverImageUrl: null,
      displayName: null,
      hideOfflinePresence: false,
      isLookingToPlay: false,
      lastSeenAt: null,
      username: null,
    };
  }

  const candidate = value as Record<string, unknown>;

  return {
    avatarUrl: getProfileAvatarUrl(
      typeof candidate.avatar_url === "string" ? candidate.avatar_url : null,
      typeof candidate.avatar_updated_at === "string" ? candidate.avatar_updated_at : null
    ),
    badges,
    coverImageUrl: getProfileCoverUrl(
      typeof candidate.cover_image_path === "string"
        ? candidate.cover_image_path
        : null,
      typeof candidate.cover_image_updated_at === "string"
        ? candidate.cover_image_updated_at
        : null
    ),
    displayName:
      typeof candidate.display_name === "string" ? candidate.display_name : null,
    hideOfflinePresence: candidate.hide_offline_presence === true,
    isLookingToPlay: candidate.is_looking_to_play === true,
    lastSeenAt:
      typeof candidate.last_seen_at === "string" ? candidate.last_seen_at : null,
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

async function tryCreateLFGPostAtomicVariants(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: {
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
  }
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

function normalizeStackMemberFromSnapshot(
  profileId: string,
  role: CompetitiveRole,
  snapshot: Record<string, unknown> | null,
  isOwner: boolean
): StackMember {
  return {
    avatarUrl: getProfileAvatarUrl(
      snapshot && typeof snapshot.avatar_url === "string" ? snapshot.avatar_url : null,
      null
    ),
    displayName:
      snapshot && typeof snapshot.display_name === "string"
        ? snapshot.display_name
        : null,
    isOwner,
    profileId,
    rankDivision:
      snapshot && typeof snapshot.rank_division === "number"
        ? snapshot.rank_division
        : null,
    rankTier:
      snapshot && typeof snapshot.rank_tier === "string"
        ? snapshot.rank_tier
        : null,
    role,
    username:
      snapshot && typeof snapshot.username === "string" ? snapshot.username : null,
  };
}

function buildOwnerStackMember(row: Record<string, unknown>): StackMember | null {
  const postId = typeof row.id === "string" ? row.id : null;
  const profileId = typeof row.profile_id === "string" ? row.profile_id : null;

  if (!postId || !profileId) {
    return null;
  }

  const profileRow =
    row.profiles && typeof row.profiles === "object" && !Array.isArray(row.profiles)
      ? (row.profiles as Record<string, unknown>)
      : null;

  return {
    avatarUrl: profileRow
      ? getProfileAvatarUrl(
          typeof profileRow.avatar_url === "string" ? profileRow.avatar_url : null,
          typeof profileRow.avatar_updated_at === "string"
            ? profileRow.avatar_updated_at
            : null
        )
      : null,
    displayName:
      profileRow && typeof profileRow.display_name === "string"
        ? profileRow.display_name
        : null,
    isOwner: true,
    profileId,
    rankDivision:
      profileRow && typeof profileRow.current_rank_division === "number"
        ? profileRow.current_rank_division
        : null,
    rankTier:
      profileRow && typeof profileRow.current_rank_tier === "string"
        ? profileRow.current_rank_tier
        : null,
    role: normalizeCompetitiveRole(row.posting_role),
    username:
      profileRow && typeof profileRow.username === "string"
        ? profileRow.username
        : null,
  };
}

async function getFallbackStackMembersByPostId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  postRows: Array<Record<string, unknown>>
) {
  const stackMembersByPostId = new Map<string, StackMember[]>();
  const postIds = postRows
    .map((row) => (typeof row.id === "string" ? row.id : null))
    .filter((id): id is string => Boolean(id));

  for (const row of postRows) {
    const postId = typeof row.id === "string" ? row.id : null;
    const ownerMember = buildOwnerStackMember(row);

    if (!postId || !ownerMember) {
      continue;
    }

    stackMembersByPostId.set(postId, [ownerMember]);
  }

  if (postIds.length === 0) {
    return stackMembersByPostId;
  }

  const { data, error } = await supabase
    .from("stack_requests")
    .select("post_id,requester_profile_id,requested_role,requester_snapshot")
    .in("post_id", postIds)
    .eq("status", "accepted")
    .order("accepted_at", { ascending: true });

  if (error) {
    throw error;
  }

  for (const row of ((data ?? []) as unknown) as Array<Record<string, unknown>>) {
    const postId = typeof row.post_id === "string" ? row.post_id : null;
    const profileId =
      typeof row.requester_profile_id === "string" ? row.requester_profile_id : null;

    if (!postId || !profileId) {
      continue;
    }

    const requestedRole = normalizeCompetitiveRole(row.requested_role);
    const snapshot =
      row.requester_snapshot &&
      typeof row.requester_snapshot === "object" &&
      !Array.isArray(row.requester_snapshot)
        ? (row.requester_snapshot as Record<string, unknown>)
        : null;
    const existing = stackMembersByPostId.get(postId) ?? [];

    existing.push(
      normalizeStackMemberFromSnapshot(profileId, requestedRole, snapshot, false)
    );
    stackMembersByPostId.set(postId, existing);
  }

  return stackMembersByPostId;
}

function normalizeLFGPostRow(
  row: Record<string, unknown>,
  badges: ProfileBadge[],
  stackMembers: StackMember[] = []
): LFGPost {
  return {
    author: normalizeAuthor(row.profiles, badges),
    createdAt: typeof row.created_at === "string" ? row.created_at : "",
    currentMemberCount:
      typeof row.current_member_count === "number" ? row.current_member_count : 1,
    description: null,
    gameMode: normalizeLFGGameMode(row.game_mode),
    heroPool: normalizeHeroPoolSnapshot(row.hero_pool_snapshot),
    id: typeof row.id === "string" ? row.id : "",
    lfgType: normalizeLFGType(row.lfg_type),
    lookingForRoles: normalizeLookingForRoles(row.looking_for_roles),
    maxGroupSize:
      typeof row.max_group_size === "number" ? row.max_group_size : STACK_MAX_GROUP_SIZE,
    profileId: typeof row.profile_id === "string" ? row.profile_id : null,
    postingRole: normalizeCompetitiveRole(row.posting_role),
    platform:
      typeof row.snapshot_platform === "string" ? row.snapshot_platform : null,
    rankDivision:
      typeof row.snapshot_rank_division === "number"
        ? row.snapshot_rank_division
        : null,
    rankTier:
      typeof row.snapshot_rank_tier === "string"
        ? row.snapshot_rank_tier
        : "Unranked",
    region: typeof row.snapshot_region === "string" ? row.snapshot_region : null,
    stackMembers,
    status: normalizeStatus(row.status),
    timezone:
      typeof row.snapshot_timezone === "string" ? row.snapshot_timezone : null,
    title: typeof row.title === "string" ? row.title : "",
  };
}

export async function getActiveLFGPosts(
  lfgType: LFGType,
  filters?: LFGFeedFilters,
  viewerProfileId?: string | null
): Promise<LFGPost[]> {
  const supabase = await createClient();
  const activePostCutoffIso = getActivePostCutoffIso();
  const isStacks = lfgType === "stacks";
  const blockedProfileIds = viewerProfileId
    ? await getBlockedProfileIdsForViewer(viewerProfileId)
    : [];

  if (isStacks) {
    await expireStackPostsRecord();
  }

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
        "snapshot_platform",
        "snapshot_rank_tier",
        "snapshot_rank_division",
        "snapshot_region",
        "snapshot_timezone",
        "hero_pool_snapshot",
        "created_at",
        ...(isStacks ? ["max_group_size", "current_member_count"] : []),
        "profiles:profile_id(username,display_name,avatar_url,avatar_updated_at,cover_image_path,cover_image_updated_at,last_seen_at,is_looking_to_play,hide_offline_presence)",
      ].join(",")
    )
    .eq("lfg_type", lfgType)
    .order("created_at", { ascending: false });

  query = isStacks
    ? query.in("status", ["active", "filled"])
    : query.eq("status", "active").gte("created_at", activePostCutoffIso);

  if (filters?.role) {
    query = query.eq("posting_role", filters.role);
  }

  if (filters?.lookingFor) {
    query = query.contains("looking_for_roles", [filters.lookingFor]);
  }

  if (filters?.mode) {
    query = query.eq("game_mode", filters.mode);
  }

  if (filters?.search) {
    query = query.ilike("title", `%${filters.search}%`);
  }

  if (filters?.region) {
    query = query.eq("snapshot_region", filters.region);
  }

  if (filters?.minRank || filters?.maxRank) {
    query = query.in(
      "snapshot_rank_tier",
      getLFGRankRangeTiers({
        maxRank: filters?.maxRank,
        minRank: filters?.minRank,
      })
    );
  }

  if (blockedProfileIds.length > 0) {
    query = query.not("profile_id", "in", `(${blockedProfileIds.join(",")})`);
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

  // Fetch active stack members for stacks posts
  const stackMembersByPostId = new Map<string, StackMember[]>();

  if (isStacks && postRows.length > 0) {
    const postIds = postRows
      .map((row) => (typeof row.id === "string" ? row.id : null))
      .filter((id): id is string => Boolean(id));

    const { data: memberRows, error: memberError } = await supabase
      .from("stack_members")
      .select(
        "post_id,profile_id,role,is_owner,profiles:profile_id(id,username,display_name,avatar_url,avatar_updated_at,current_rank_tier,current_rank_division)"
      )
      .in("post_id", postIds)
      .is("removed_at", null)
      .order("is_owner", { ascending: false })
      .order("joined_at", { ascending: true });

    if (memberError) {
      if (isMissingStackMembersSupportError(memberError)) {
        const fallbackMembers = await getFallbackStackMembersByPostId(supabase, postRows);

        for (const [postId, members] of fallbackMembers.entries()) {
          stackMembersByPostId.set(postId, members);
        }
      } else {
        throw memberError;
      }
    } else {
      for (const row of ((memberRows ?? []) as unknown) as Array<Record<string, unknown>>) {
        const postId = typeof row.post_id === "string" ? row.post_id : null;
        if (!postId) continue;

        const profileRow =
          row.profiles && typeof row.profiles === "object" && !Array.isArray(row.profiles)
            ? (row.profiles as Record<string, unknown>)
            : null;

        const profileId =
          profileRow && typeof profileRow.id === "string"
            ? profileRow.id
            : typeof row.profile_id === "string"
              ? row.profile_id
              : null;

        if (!profileId) continue;

        const member: StackMember = {
          avatarUrl: profileRow
            ? getProfileAvatarUrl(
                typeof profileRow.avatar_url === "string" ? profileRow.avatar_url : null,
                typeof profileRow.avatar_updated_at === "string"
                  ? profileRow.avatar_updated_at
                  : null
              )
            : null,
          displayName:
            profileRow && typeof profileRow.display_name === "string"
              ? profileRow.display_name
              : null,
          isOwner: row.is_owner === true,
          profileId,
          rankDivision:
            profileRow && typeof profileRow.current_rank_division === "number"
              ? profileRow.current_rank_division
              : null,
          rankTier:
            profileRow && typeof profileRow.current_rank_tier === "string"
              ? profileRow.current_rank_tier
              : null,
          role: normalizeCompetitiveRole(row.role),
          username:
            profileRow && typeof profileRow.username === "string"
              ? profileRow.username
              : null,
        };

        const existing = stackMembersByPostId.get(postId) ?? [];
        existing.push(member);
        stackMembersByPostId.set(postId, existing);
      }
    }
  }

  return postRows.map((row) =>
    normalizeLFGPostRow(
      row,
      typeof row.profile_id === "string"
        ? badgesByProfileId.get(row.profile_id) ?? []
        : [],
      typeof row.id === "string"
        ? (stackMembersByPostId.get(row.id) ?? []).filter(
            (member) => !blockedProfileIds.includes(member.profileId)
          )
        : []
    )
  );
}

export async function getRecentPostsByProfileId(
  profileId: string,
  limit = 2,
  viewerProfileId?: string | null
): Promise<LFGPost[]> {
  const supabase = await createClient();
  const activePostCutoffIso = getActivePostCutoffIso();
  const blockedProfileIds = viewerProfileId
    ? await getBlockedProfileIdsForViewer(viewerProfileId)
    : [];

  if (blockedProfileIds.includes(profileId)) {
    return [];
  }

  await expireStackPostsRecord();
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
        "snapshot_platform",
        "snapshot_rank_tier",
        "snapshot_rank_division",
        "snapshot_region",
        "snapshot_timezone",
        "hero_pool_snapshot",
        "created_at",
        "profiles:profile_id(username,display_name,avatar_url,avatar_updated_at,cover_image_path,cover_image_updated_at,last_seen_at,is_looking_to_play,hide_offline_presence)",
      ].join(",")
    )
    .eq("profile_id", profileId)
    .in("status", ["active", "filled"])
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
  limit = 30,
  viewerProfileId?: string | null
): Promise<LFGPost[]> {
  const supabase = await createClient();
  const blockedProfileIds = viewerProfileId
    ? await getBlockedProfileIdsForViewer(viewerProfileId)
    : [];

  if (blockedProfileIds.includes(profileId)) {
    return [];
  }

  await expireStackPostsRecord();
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
        "snapshot_platform",
        "snapshot_rank_tier",
        "snapshot_rank_division",
        "snapshot_region",
        "snapshot_timezone",
        "hero_pool_snapshot",
        "created_at",
        "profiles:profile_id(username,display_name,avatar_url,avatar_updated_at,cover_image_path,cover_image_updated_at,last_seen_at,is_looking_to_play,hide_offline_presence)",
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
  if (input.lfgType === "stacks") {
    await expireStackPostsRecord();
  }
  const { data, error } = await supabase
    .from("lfg_posts")
    .select("posting_role")
    .eq("profile_id", input.profileId)
    .eq("lfg_type", input.lfgType)
    .in("status", input.lfgType === "stacks" ? ["active", "filled"] : ["active"])
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
  return tryCreateLFGPostAtomicVariants(supabase, input);
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
  if (input.lfgType === "stacks") {
    await expireStackPostsRecord();
  }
  const { data, error } = await supabase
    .from("lfg_posts")
    .select("id,title")
    .eq("profile_id", input.profileId)
    .eq("game_mode", input.gameMode)
    .eq("lfg_type", input.lfgType)
    .eq("posting_role", input.postingRole)
    .in("status", input.lfgType === "stacks" ? ["active", "filled"] : ["active"])
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
  if (input.lfgType === "stacks") {
    await expireStackPostsRecord();
  }
  const { count, error } = await supabase
    .from("lfg_posts")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", input.profileId)
    .eq("lfg_type", input.lfgType)
    .eq("posting_role", input.postingRole)
    .in("status", input.lfgType === "stacks" ? ["active", "filled"] : ["active"])
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

  await expireStackPostsRecord();

  const { data: ownerCheck, error: ownerError } = await supabase
    .from("lfg_posts")
    .select("id")
    .eq("id", input.postId)
    .eq("profile_id", input.profileId)
    .in("status", ["active", "filled"])
    .maybeSingle();

  if (ownerError) {
    throw ownerError;
  }

  if (!ownerCheck) {
    return normalizeLFGCloseResult({ updated: false, error_code: "forbidden" });
  }

  const { data, error } = await supabase.rpc("close_owned_lfg_post", {
    p_post_id: input.postId,
  });

  if (error) {
    throw error;
  }

  return normalizeLFGCloseResult(data);
}
