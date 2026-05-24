import { getProfileBadges } from "@/lib/badges/badges";
import type { ProfileBadge } from "@/lib/badges/badge-types";
import { getBlockedProfileIdsForViewer, isBlocked } from "@/lib/blocks/user-blocks";
import { stacksPerfLog } from "@/lib/dev/perf-log";
import { getProfileAvatarUrl } from "@/lib/profiles/profile-media";
import { getCurrentProfile } from "@/lib/profiles/get-current-profile";
import { createClient } from "@/lib/supabase/server";

import { getLFGRankRangeTiers, type LFGFeedFilters } from "../lfg-feed-filters";
import { isMissingStackMembersSupportError } from "../stack-requests";
import type { LFGPost, LFGType, StackMember } from "../lfg-post-types";
import {
  buildOwnerStackMember,
  normalizeBadgeDefinition,
  normalizeCompetitiveRole,
  normalizeLFGPostRow,
  normalizeStackMemberFromSnapshot,
} from "./post-normalization";
import {
  createEmptyRoleCountMap,
  type ActiveLFGPostCountsByRole,
} from "./posts-policy";

export type StackPostDetail = {
  expiresAt: string | null;
  isActive: boolean;
  isExpired: boolean;
  post: LFGPost;
};

async function loadBadgesByProfileId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  postRows: Array<Record<string, unknown>>,
  perfLabel?: string
) {
  const profileIds = Array.from(
    new Set(
      postRows
        .map((row) => (typeof row.profile_id === "string" ? row.profile_id : null))
        .filter((profileId): profileId is string => Boolean(profileId))
    )
  );
  const badgesByProfileId = new Map<string, ProfileBadge[]>();

  if (profileIds.length === 0) {
    return badgesByProfileId;
  }

  const tBadges = Date.now();
  const { data: badgeRows, error: badgeError } = await supabase
    .from("profile_badges")
    .select("profile_id,granted_at,badge:badge_id(id,slug,label,description,icon,color)")
    .in("profile_id", profileIds)
    .order("granted_at", { ascending: true });
  if (perfLabel) {
    stacksPerfLog(`${perfLabel} badges`, tBadges, badgeRows?.length ?? 0);
  }

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

  return badgesByProfileId;
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

  for (const row of (data ?? []) as Array<Record<string, unknown>>) {
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

async function loadStackMembersByPostId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  postRows: Array<Record<string, unknown>>,
  perfLabel?: string
) {
  const stackMembersByPostId = new Map<string, StackMember[]>();
  const postIds = postRows
    .map((row) => (typeof row.id === "string" ? row.id : null))
    .filter((id): id is string => Boolean(id));

  if (postIds.length === 0) {
    return stackMembersByPostId;
  }

  const tMembers = Date.now();
  const { data: memberRows, error: memberError } = await supabase
    .from("stack_members")
    .select(
      "post_id,profile_id,role,is_owner,profiles:profile_id(id,username,display_name,avatar_url,avatar_updated_at,current_rank_tier,current_rank_division)"
    )
    .in("post_id", postIds)
    .is("removed_at", null)
    .order("is_owner", { ascending: false })
    .order("joined_at", { ascending: true });
  if (perfLabel) {
    stacksPerfLog(`${perfLabel} stack members`, tMembers, memberRows?.length ?? 0);
  }

  if (memberError) {
    if (!isMissingStackMembersSupportError(memberError)) {
      throw memberError;
    }

    return getFallbackStackMembersByPostId(supabase, postRows);
  }

  for (const row of ((memberRows ?? []) as unknown) as Array<Record<string, unknown>>) {
    const postId = typeof row.post_id === "string" ? row.post_id : null;
    if (!postId) {
      continue;
    }

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

    if (!profileId) {
      continue;
    }

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

  return stackMembersByPostId;
}

async function hydrateSingleStackPost(
  supabase: Awaited<ReturnType<typeof createClient>>,
  postRow: Record<string, unknown>,
  blockedProfileIds: string[] = [],
  options?: {
    includeAuthorBadges?: boolean;
  }
) {
  const includeAuthorBadges = options?.includeAuthorBadges ?? true;
  const t = Date.now();
  const [badgesByProfileId, stackMembersByPostId] = await Promise.all([
    includeAuthorBadges
      ? loadBadgesByProfileId(supabase, [postRow], "hydrateSingleStackPost")
      : (() => {
          const skippedBadges = new Map<string, ProfileBadge[]>();
          stacksPerfLog("hydrateSingleStackPost badges", t, 0);
          return Promise.resolve(skippedBadges);
        })(),
    loadStackMembersByPostId(supabase, [postRow], "hydrateSingleStackPost"),
  ]);
  stacksPerfLog('hydrateSingleStackPost badges+members parallel', t);
  const normalizedPostId = typeof postRow.id === "string" ? postRow.id : null;

  return normalizeLFGPostRow(
    postRow,
    typeof postRow.profile_id === "string"
      ? badgesByProfileId.get(postRow.profile_id) ?? []
      : [],
    normalizedPostId
      ? (stackMembersByPostId.get(normalizedPostId) ?? []).filter(
          (member) => !blockedProfileIds.includes(member.profileId)
        )
      : []
  );
}

function getStackLookupErrorText(error: unknown) {
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

function isMissingActiveStackLookupRpcError(error: unknown) {
  const text = getStackLookupErrorText(error);

  return (
    text.includes("get_profile_active_stack_post_id") &&
    (text.includes("pgrst") ||
      text.includes("could not find") ||
      text.includes("does not exist") ||
      text.includes("not found"))
  );
}

async function getCurrentActiveStackPostIdFromMembershipQuery(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profileId: string
) {
  const { data, error } = await supabase
    .from("stack_members")
    .select("post_id,is_owner,joined_at,lfg_posts!inner(status)")
    .eq("profile_id", profileId)
    .is("removed_at", null)
    .in("lfg_posts.status", ["active", "filled"])
    .gt("lfg_posts.expires_at", new Date().toISOString())
    .order("is_owner", { ascending: false })
    .order("joined_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (isMissingStackMembersSupportError(error)) {
      return null;
    }

    throw error;
  }

  return data && typeof data.post_id === "string" ? data.post_id : null;
}

export async function getCurrentActiveStackPostIdForProfile(profileId: string) {
  const { user, profile } = await getCurrentProfile();

  if (!user || !profile || profile.id !== profileId) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_profile_active_stack_post_id", {
    p_exclude_post_id: null,
    p_profile_id: profileId,
  });

  if (error) {
    const fallbackPostId = await getCurrentActiveStackPostIdFromMembershipQuery(
      supabase,
      profileId
    );

    if (fallbackPostId) {
      return fallbackPostId;
    }

    if (
      isMissingStackMembersSupportError(error) ||
      isMissingActiveStackLookupRpcError(error)
    ) {
      return null;
    }

    throw error;
  }

  const rpcPostId = typeof data === "string" ? data : null;

  if (rpcPostId) {
    return rpcPostId;
  }

  return getCurrentActiveStackPostIdFromMembershipQuery(supabase, profileId);
}

export async function getActiveLFGPosts(
  lfgType: LFGType,
  filters?: LFGFeedFilters,
  viewerProfileId?: string | null
): Promise<LFGPost[]> {
  const supabase = await createClient();
  const isStacks = lfgType === "stacks";
  const blockedProfileIds = viewerProfileId
    ? await getBlockedProfileIdsForViewer(viewerProfileId)
    : [];

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
    ? query.in("status", ["active", "filled"]).gt("expires_at", new Date().toISOString())
    : query.eq("status", "active").gt("expires_at", new Date().toISOString());

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
  const [badgesByProfileId, stackMembersByPostId] = await Promise.all([
    loadBadgesByProfileId(supabase, postRows, "getActiveLFGPosts"),
    isStacks && postRows.length > 0
      ? loadStackMembersByPostId(supabase, postRows, "getActiveLFGPosts")
      : Promise.resolve(new Map<string, StackMember[]>()),
  ]);

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

export async function getCurrentActiveStackForProfile(
  profileId: string
): Promise<LFGPost | null> {
  const postId = await getCurrentActiveStackPostIdForProfile(profileId);

  if (!postId) {
    return null;
  }

  return getActiveStackPostById(postId);
}

async function getStackPostDetailByIdInternal(input: {
  activeOnly?: boolean;
  postId: string;
  viewerProfileId?: string | null;
}): Promise<StackPostDetail | null> {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();
  const blockedProfileIdsPromise = input.viewerProfileId
    ? (() => {
        const tBlocked = Date.now();
        return getBlockedProfileIdsForViewer(input.viewerProfileId).then((blockedProfileIds) => {
          stacksPerfLog("getStackPostDetailById blocks", tBlocked, blockedProfileIds.length);
          return blockedProfileIds;
        });
      })()
    : Promise.resolve<string[]>([]);
  const postQueryPromise = (() => {
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
          "expires_at",
          "max_group_size",
          "current_member_count",
          "profiles:profile_id(username,display_name,avatar_url,avatar_updated_at,cover_image_path,cover_image_updated_at,last_seen_at,is_looking_to_play,hide_offline_presence)",
        ].join(",")
      )
      .eq("id", input.postId)
      .eq("lfg_type", "stacks");

    query = input.activeOnly
      ? query.in("status", ["active", "filled"]).gt("expires_at", nowIso)
      : query.neq("status", "archived");

    const tPostQuery = Date.now();
    return query.limit(1).maybeSingle().then((result) => {
      stacksPerfLog("getStackPostDetailById post query", tPostQuery, result.data ? 1 : 0);
      return result;
    });
  })();

  const [blockedProfileIds, { data: postData, error: postError }] = await Promise.all([
    blockedProfileIdsPromise,
    postQueryPromise,
  ]);

  if (postError) {
    throw postError;
  }

  const postRow =
    postData && typeof postData === "object" && !Array.isArray(postData)
      ? (postData as Record<string, unknown>)
      : null;

  if (!postRow) {
    return null;
  }

  const authorProfileId =
    typeof postRow.profile_id === "string" ? postRow.profile_id : null;

  if (authorProfileId && blockedProfileIds.includes(authorProfileId)) {
    return null;
  }

  const tHydrate = Date.now();
  const post = await hydrateSingleStackPost(supabase, postRow, blockedProfileIds, {
    includeAuthorBadges: false,
  });
  stacksPerfLog('getStackPostDetailById hydrate', tHydrate);
  const expiresAt = typeof postRow.expires_at === "string" ? postRow.expires_at : null;
  const isExpired = Boolean(expiresAt && expiresAt <= nowIso);
  const isActive = (post.status === "active" || post.status === "filled") && !isExpired;

  return {
    expiresAt,
    isActive,
    isExpired,
    post,
  };
}

export async function getStackPostDetailById(
  postId: string,
  viewerProfileId?: string | null
): Promise<StackPostDetail | null> {
  return getStackPostDetailByIdInternal({
    postId,
    viewerProfileId,
  });
}

export async function getStackPostById(
  postId: string,
  viewerProfileId?: string | null
): Promise<LFGPost | null> {
  const detail = await getStackPostDetailByIdInternal({
    postId,
    viewerProfileId,
  });

  return detail?.post ?? null;
}

export async function getActiveStackPostById(
  postId: string,
  viewerProfileId?: string | null
): Promise<LFGPost | null> {
  const detail = await getStackPostDetailByIdInternal({
    activeOnly: true,
    postId,
    viewerProfileId,
  });

  return detail?.post ?? null;
}

export async function getRecentPostsByProfileId(
  profileId: string,
  limit = 2,
  viewerProfileId?: string | null,
  options?: {
    hideWhenViewerBlockedTarget?: boolean;
  }
): Promise<LFGPost[]> {
  const supabase = await createClient();
  const blockedProfileIds = viewerProfileId
    ? await getBlockedProfileIdsForViewer(viewerProfileId)
    : [];
  const hideWhenViewerBlockedTarget =
    options?.hideWhenViewerBlockedTarget ?? true;

  if (
    blockedProfileIds.includes(profileId) &&
    (hideWhenViewerBlockedTarget || !(await isBlocked(viewerProfileId ?? null, profileId)))
  ) {
    return [];
  }

  const [profileBadges, { data, error }] = await Promise.all([
    getProfileBadges(profileId),
    supabase
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
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  if (error) {
    throw error;
  }

  const postRows = ((data ?? []) as unknown) as Array<Record<string, unknown>>;

  return postRows.map((row) => normalizeLFGPostRow(row, profileBadges));
}

export async function getPostsByProfileId(
  profileId: string,
  limit = 30,
  viewerProfileId?: string | null,
  options?: {
    hideWhenViewerBlockedTarget?: boolean;
  }
): Promise<LFGPost[]> {
  const supabase = await createClient();
  const blockedProfileIds = viewerProfileId
    ? await getBlockedProfileIdsForViewer(viewerProfileId)
    : [];
  const hideWhenViewerBlockedTarget =
    options?.hideWhenViewerBlockedTarget ?? true;

  if (
    blockedProfileIds.includes(profileId) &&
    (hideWhenViewerBlockedTarget || !(await isBlocked(viewerProfileId ?? null, profileId)))
  ) {
    return [];
  }

  const [profileBadges, { data, error }] = await Promise.all([
    getProfileBadges(profileId),
    supabase
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
      .limit(limit),
  ]);

  if (error) {
    throw error;
  }

  const postRows = ((data ?? []) as unknown) as Array<Record<string, unknown>>;

  return postRows.map((row) => normalizeLFGPostRow(row, profileBadges));
}

export async function getActiveLFGPostCountsByRole(input: {
  lfgType: LFGType;
  profileId: string;
}): Promise<ActiveLFGPostCountsByRole> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lfg_posts")
    .select("posting_role")
    .eq("profile_id", input.profileId)
    .eq("lfg_type", input.lfgType)
    .in("status", input.lfgType === "stacks" ? ["active", "filled"] : ["active"])
    .gt("expires_at", new Date().toISOString());

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

export type StackMemberContactInfo = {
  battlenetHandle: string | null;
  discordUsername: string | null;
  profileId: string;
};

/**
 * Fetches Discord and Battle.net contact info for all active members of a stack.
 * Returns null if the viewer is not an active (non-removed) member of the stack.
 * Enforces visibility server-side by proving membership before selecting
 * contact columns for the rest of the stack.
 */
export async function getStackMemberContactInfoForViewer(input: {
  postId: string;
  viewerProfileId: string;
}): Promise<Map<string, StackMemberContactInfo> | null> {
  const supabase = await createClient();

  const { data: membershipRow, error: membershipError } = await supabase
    .from("stack_members")
    .select("profile_id")
    .eq("post_id", input.postId)
    .eq("profile_id", input.viewerProfileId)
    .is("removed_at", null)
    .limit(1)
    .maybeSingle();

  if (membershipError || typeof membershipRow?.profile_id !== "string") {
    return null;
  }

  const { data, error } = await supabase
    .from("stack_members")
    .select("profile_id, profiles:profile_id(discord_username, battlenet_handle)")
    .eq("post_id", input.postId)
    .is("removed_at", null);

  if (error) {
    return null;
  }

  const rows = ((data ?? []) as unknown) as Array<Record<string, unknown>>;

  const result = new Map<string, StackMemberContactInfo>();

  for (const row of rows) {
    const profileId = typeof row.profile_id === "string" ? row.profile_id : null;
    if (!profileId) continue;

    const profileRow =
      row.profiles && typeof row.profiles === "object" && !Array.isArray(row.profiles)
        ? (row.profiles as Record<string, unknown>)
        : null;

    result.set(profileId, {
      battlenetHandle:
        profileRow && typeof profileRow.battlenet_handle === "string"
          ? profileRow.battlenet_handle
          : null,
      discordUsername:
        profileRow && typeof profileRow.discord_username === "string"
          ? profileRow.discord_username
          : null,
      profileId,
    });
  }

  return result;
}
