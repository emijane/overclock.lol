import { createClient } from "@/lib/supabase/server";
import {
  normalizeExpirePlayInvitesResult,
  normalizeSendPlayInviteResult,
  normalizeUpdatePlayInviteResult,
} from "@/lib/matches/play-invite-rpc-normalizers";
import {
  deriveLFGInviteStates,
  deriveProfileInviteState,
} from "@/lib/matches/play-invite-state-derivation";
import type {
  LFGInviteStateMap,
  ProfileInviteState,
} from "@/lib/matches/play-invite-types";
import { formatCurrentRank } from "@/lib/profiles/profile-editor";

export type { PlayInviteStatus } from "@/lib/matches/play-invite-rpc-types";

type PlayInviteSnapshot = {
  avatarUrl: string | null;
  displayName: string | null;
  mainRole: string | null;
  rankDivision: number | null;
  rankTier: string | null;
  region: string | null;
  username: string | null;
};

type MatchProfileRow = {
  battlenet_handle: string | null;
  current_rank_division: number | null;
  current_rank_tier: string | null;
  discord_avatar_url: string | null;
  discord_username: string | null;
  display_name: string | null;
  id: string;
  region: string | null;
  username: string | null;
};

type MatchSourcePostRow = {
  id: string;
  title: string | null;
};

export type MatchParticipant = {
  avatarUrl: string | null;
  battlenetHandle: string | null;
  discordUsername: string | null;
  displayName: string | null;
  mainRole: string | null;
  profileId: string;
  rankDivision: number | null;
  rankLabel: string;
  rankTier: string | null;
  region: string | null;
  username: string | null;
};

export type AcceptedPlayMatch = {
  acceptedAt: string | null;
  createdAt: string;
  id: string;
  message: string | null;
  participant: MatchParticipant;
  sourcePostTitle: string | null;
};

export type PendingSentPlayInvite = {
  createdAt: string;
  expiresAt: string;
  id: string;
  message: string | null;
  participant: MatchParticipant;
  sourcePostTitle: string | null;
};

export type IncomingPendingPlayInvite = {
  createdAt: string;
  expiresAt: string;
  id: string;
  message: string | null;
  participant: MatchParticipant;
  sourcePostTitle: string | null;
};

function normalizePlayInviteSnapshot(value: unknown): PlayInviteSnapshot | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const candidate = value as Record<string, unknown>;

  return {
    avatarUrl:
      typeof candidate.avatar_url === "string" ? candidate.avatar_url : null,
    displayName:
      typeof candidate.display_name === "string" ? candidate.display_name : null,
    mainRole: typeof candidate.main_role === "string" ? candidate.main_role : null,
    rankDivision:
      typeof candidate.rank_division === "number" ? candidate.rank_division : null,
    rankTier: typeof candidate.rank_tier === "string" ? candidate.rank_tier : null,
    region: typeof candidate.region === "string" ? candidate.region : null,
    username: typeof candidate.username === "string" ? candidate.username : null,
  };
}

function normalizeMatchProfileRow(value: unknown): MatchProfileRow | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const candidate = value as Record<string, unknown>;

  if (typeof candidate.id !== "string") {
    return null;
  }

  return {
    battlenet_handle:
      typeof candidate.battlenet_handle === "string"
        ? candidate.battlenet_handle
        : null,
    current_rank_division:
      typeof candidate.current_rank_division === "number"
        ? candidate.current_rank_division
        : null,
    current_rank_tier:
      typeof candidate.current_rank_tier === "string"
        ? candidate.current_rank_tier
        : null,
    discord_avatar_url:
      typeof candidate.discord_avatar_url === "string"
        ? candidate.discord_avatar_url
        : null,
    discord_username:
      typeof candidate.discord_username === "string"
        ? candidate.discord_username
        : null,
    display_name:
      typeof candidate.display_name === "string" ? candidate.display_name : null,
    id: candidate.id,
    region: typeof candidate.region === "string" ? candidate.region : null,
    username: typeof candidate.username === "string" ? candidate.username : null,
  };
}

function normalizeMatchSourcePostRow(value: unknown): MatchSourcePostRow | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const candidate = value as Record<string, unknown>;

  if (typeof candidate.id !== "string") {
    return null;
  }

  return {
    id: candidate.id,
    title: typeof candidate.title === "string" ? candidate.title : null,
  };
}

function toParticipant(input: {
  participantId: string;
  profile: MatchProfileRow | null;
  snapshot: PlayInviteSnapshot | null;
}): MatchParticipant {
  const rankTier = input.snapshot?.rankTier ?? input.profile?.current_rank_tier ?? null;
  const rankDivision =
    input.snapshot?.rankDivision ?? input.profile?.current_rank_division ?? null;

  return {
    avatarUrl: input.snapshot?.avatarUrl ?? input.profile?.discord_avatar_url ?? null,
    battlenetHandle: input.profile?.battlenet_handle ?? null,
    discordUsername: input.profile?.discord_username ?? null,
    displayName: input.snapshot?.displayName ?? input.profile?.display_name ?? null,
    mainRole: input.snapshot?.mainRole ?? null,
    profileId: input.participantId,
    rankDivision,
    rankLabel: formatCurrentRank(rankTier, rankDivision),
    rankTier,
    region: input.snapshot?.region ?? input.profile?.region ?? null,
    username: input.snapshot?.username ?? input.profile?.username ?? null,
  };
}

async function getMatchProfilesById(profileIds: string[]) {
  if (profileIds.length === 0) {
    return new Map<string, MatchProfileRow>();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, username, display_name, discord_avatar_url, region, current_rank_tier, current_rank_division, discord_username, battlenet_handle"
    )
    .in("id", profileIds);

  if (error) {
    throw error;
  }

  const profiles = new Map<string, MatchProfileRow>();

  for (const row of (data ?? []) as unknown[]) {
    const profile = normalizeMatchProfileRow(row);

    if (profile) {
      profiles.set(profile.id, profile);
    }
  }

  return profiles;
}

async function getMatchSourcePostsById(postIds: string[]) {
  if (postIds.length === 0) {
    return new Map<string, MatchSourcePostRow>();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lfg_posts")
    .select("id, title")
    .in("id", postIds);

  if (error) {
    throw error;
  }

  const posts = new Map<string, MatchSourcePostRow>();

  for (const row of (data ?? []) as unknown[]) {
    const post = normalizeMatchSourcePostRow(row);

    if (post) {
      posts.set(post.id, post);
    }
  }

  return posts;
}

export async function sendPlayInviteRecord(input: {
  message?: string | null;
  recipientProfileId: string;
  sourceLFGPostId?: string | null;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("send_play_invite", {
    p_message: input.message ?? null,
    p_recipient_profile_id: input.recipientProfileId,
    p_source_lfg_post_id: input.sourceLFGPostId ?? null,
  });

  if (error) {
    throw error;
  }

  return normalizeSendPlayInviteResult(data);
}

export async function acceptPlayInviteRecord(input: { inviteId: string }) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("accept_play_invite", {
    p_invite_id: input.inviteId,
  });

  if (error) {
    throw error;
  }

  return normalizeUpdatePlayInviteResult(data, "accept_play_invite");
}

export async function declinePlayInviteRecord(input: { inviteId: string }) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("decline_play_invite", {
    p_invite_id: input.inviteId,
  });

  if (error) {
    throw error;
  }

  return normalizeUpdatePlayInviteResult(data, "decline_play_invite");
}

export async function cancelPlayInviteRecord(input: { inviteId: string }) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("cancel_play_invite", {
    p_invite_id: input.inviteId,
  });

  if (error) {
    throw error;
  }

  return normalizeUpdatePlayInviteResult(data, "cancel_play_invite");
}

export async function expirePlayInvitesRecord(input?: { inviteId?: string | null }) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("expire_play_invites", {
    p_invite_id: input?.inviteId ?? null,
  });

  if (error) {
    throw error;
  }

  return normalizeExpirePlayInvitesResult(data);
}

export async function getAcceptedPlayMatches(input: {
  currentProfileId: string;
  limit?: number;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("play_invites")
    .select(
      "id, sender_profile_id, recipient_profile_id, source_lfg_post_id, message, sender_snapshot, recipient_snapshot, created_at, accepted_at"
    )
    .eq("status", "accepted")
    .or(
      `sender_profile_id.eq.${input.currentProfileId},recipient_profile_id.eq.${input.currentProfileId}`
    )
    .order("accepted_at", { ascending: false })
    .limit(input.limit ?? 30);

  if (error) {
    throw error;
  }

  const rows = ((data ?? []) as Array<Record<string, unknown>>).filter(
    (row) =>
      typeof row.id === "string" &&
      typeof row.sender_profile_id === "string" &&
      typeof row.recipient_profile_id === "string" &&
      typeof row.created_at === "string"
  );

  const participantIds = Array.from(
    new Set(
      rows.map((row) =>
        row.sender_profile_id === input.currentProfileId
          ? (row.recipient_profile_id as string)
          : (row.sender_profile_id as string)
      )
    )
  );
  const postIds = Array.from(
    new Set(
      rows
        .map((row) =>
          typeof row.source_lfg_post_id === "string" ? row.source_lfg_post_id : null
        )
        .filter((postId): postId is string => Boolean(postId))
    )
  );
  const [profilesById, postsById] = await Promise.all([
    getMatchProfilesById(participantIds),
    getMatchSourcePostsById(postIds),
  ]);

  return rows.map((row) => {
    const senderProfileId = row.sender_profile_id as string;
    const recipientProfileId = row.recipient_profile_id as string;
    const participantId =
      senderProfileId === input.currentProfileId ? recipientProfileId : senderProfileId;
    const snapshot =
      participantId === senderProfileId
        ? normalizePlayInviteSnapshot(row.sender_snapshot)
        : normalizePlayInviteSnapshot(row.recipient_snapshot);
    const sourcePostId =
      typeof row.source_lfg_post_id === "string" ? row.source_lfg_post_id : null;

    return {
      acceptedAt: typeof row.accepted_at === "string" ? row.accepted_at : null,
      createdAt: row.created_at as string,
      id: row.id as string,
      message: typeof row.message === "string" ? row.message : null,
      participant: toParticipant({
        participantId,
        profile: profilesById.get(participantId) ?? null,
        snapshot,
      }),
      sourcePostTitle: sourcePostId ? postsById.get(sourcePostId)?.title ?? null : null,
    } satisfies AcceptedPlayMatch;
  });
}

export async function getPendingSentPlayInvites(input: {
  currentProfileId: string;
  limit?: number;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("play_invites")
    .select(
      "id, recipient_profile_id, source_lfg_post_id, message, recipient_snapshot, created_at, expires_at"
    )
    .eq("status", "pending")
    .eq("sender_profile_id", input.currentProfileId)
    .order("created_at", { ascending: false })
    .limit(input.limit ?? 20);

  if (error) {
    throw error;
  }

  const rows = ((data ?? []) as Array<Record<string, unknown>>).filter(
    (row) =>
      typeof row.id === "string" &&
      typeof row.recipient_profile_id === "string" &&
      typeof row.created_at === "string" &&
      typeof row.expires_at === "string"
  );

  const participantIds = Array.from(
    new Set(rows.map((row) => row.recipient_profile_id as string))
  );
  const postIds = Array.from(
    new Set(
      rows
        .map((row) =>
          typeof row.source_lfg_post_id === "string" ? row.source_lfg_post_id : null
        )
        .filter((postId): postId is string => Boolean(postId))
    )
  );
  const [profilesById, postsById] = await Promise.all([
    getMatchProfilesById(participantIds),
    getMatchSourcePostsById(postIds),
  ]);

  return rows.map((row) => {
    const participantId = row.recipient_profile_id as string;
    const sourcePostId =
      typeof row.source_lfg_post_id === "string" ? row.source_lfg_post_id : null;

    return {
      createdAt: row.created_at as string,
      expiresAt: row.expires_at as string,
      id: row.id as string,
      message: typeof row.message === "string" ? row.message : null,
      participant: toParticipant({
        participantId,
        profile: profilesById.get(participantId) ?? null,
        snapshot: normalizePlayInviteSnapshot(row.recipient_snapshot),
      }),
      sourcePostTitle: sourcePostId ? postsById.get(sourcePostId)?.title ?? null : null,
    } satisfies PendingSentPlayInvite;
  });
}

export async function getIncomingPendingPlayInvites(input: {
  currentProfileId: string;
  limit?: number;
}) {
  const supabase = await createClient();
  const { data, error, count } = await supabase
    .from("play_invites")
    .select(
      "id, sender_profile_id, source_lfg_post_id, message, sender_snapshot, created_at, expires_at",
      { count: "exact" }
    )
    .eq("status", "pending")
    .eq("recipient_profile_id", input.currentProfileId)
    .order("expires_at", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(input.limit ?? 9);

  if (error) {
    throw error;
  }

  const rows = ((data ?? []) as Array<Record<string, unknown>>).filter(
    (row) =>
      typeof row.id === "string" &&
      typeof row.sender_profile_id === "string" &&
      typeof row.created_at === "string" &&
      typeof row.expires_at === "string"
  );

  const participantIds = Array.from(
    new Set(rows.map((row) => row.sender_profile_id as string))
  );
  const postIds = Array.from(
    new Set(
      rows
        .map((row) =>
          typeof row.source_lfg_post_id === "string" ? row.source_lfg_post_id : null
        )
        .filter((postId): postId is string => Boolean(postId))
    )
  );
  const [profilesById, postsById] = await Promise.all([
    getMatchProfilesById(participantIds),
    getMatchSourcePostsById(postIds),
  ]);

  return {
    invites: rows.map((row) => {
      const participantId = row.sender_profile_id as string;
      const sourcePostId =
        typeof row.source_lfg_post_id === "string" ? row.source_lfg_post_id : null;

      return {
        createdAt: row.created_at as string,
        expiresAt: row.expires_at as string,
        id: row.id as string,
        message: typeof row.message === "string" ? row.message : null,
        participant: toParticipant({
          participantId,
          profile: profilesById.get(participantId) ?? null,
          snapshot: normalizePlayInviteSnapshot(row.sender_snapshot),
        }),
        sourcePostTitle: sourcePostId
          ? postsById.get(sourcePostId)?.title ?? null
          : null,
      } satisfies IncomingPendingPlayInvite;
    }),
    totalCount: count ?? 0,
  };
}

export async function getProfileInviteState(input: {
  currentProfileId: string | null;
  targetProfileId: string;
}): Promise<ProfileInviteState> {
  const supabase = await createClient();
  const [pendingResult, acceptedResult] = await Promise.all([
    supabase
      .from("play_invites")
      .select("id", { head: true, count: "exact" })
      .eq("sender_profile_id", input.currentProfileId)
      .eq("recipient_profile_id", input.targetProfileId)
      .eq("status", "pending"),
    supabase
      .from("play_invites")
      .select("id", { head: true, count: "exact" })
      .eq("status", "accepted")
      .or(
        [
          `and(sender_profile_id.eq.${input.currentProfileId},recipient_profile_id.eq.${input.targetProfileId})`,
          `and(sender_profile_id.eq.${input.targetProfileId},recipient_profile_id.eq.${input.currentProfileId})`,
        ].join(",")
      ),
  ]);

  if (pendingResult.error) {
    throw pendingResult.error;
  }

  if (acceptedResult.error) {
    throw acceptedResult.error;
  }

  return deriveProfileInviteState({
    acceptedCount: acceptedResult.count,
    currentProfileId: input.currentProfileId,
    pendingCount: pendingResult.count,
    targetProfileId: input.targetProfileId,
  });
}

export async function getLFGPostInviteStates(input: {
  currentProfileId: string | null;
  posts: Array<{
    id: string;
    profileId: string | null;
  }>;
}) {
  const states: LFGInviteStateMap = {};

  for (const post of input.posts) {
    states[post.id] = "invite_to_play";
  }

  if (!input.currentProfileId) {
    return states;
  }

  const eligiblePosts = input.posts.filter(
    (post) => Boolean(post.profileId) && post.profileId !== input.currentProfileId
  ) as Array<{ id: string; profileId: string }>;

  if (eligiblePosts.length === 0) {
    return states;
  }

  const recipientIds = Array.from(
    new Set(eligiblePosts.map((post) => post.profileId))
  );
  const postIds = eligiblePosts.map((post) => post.id);
  const supabase = await createClient();

  const [pendingResult, acceptedResult] = await Promise.all([
    supabase
      .from("play_invites")
      .select("recipient_profile_id, source_lfg_post_id")
      .eq("sender_profile_id", input.currentProfileId)
      .eq("status", "pending")
      .in("recipient_profile_id", recipientIds)
      .in("source_lfg_post_id", postIds),
    supabase
      .from("play_invites")
      .select("sender_profile_id, recipient_profile_id")
      .eq("status", "accepted")
      .or(
        [
          `and(sender_profile_id.eq.${input.currentProfileId},recipient_profile_id.in.(${recipientIds.join(",")}))`,
          `and(recipient_profile_id.eq.${input.currentProfileId},sender_profile_id.in.(${recipientIds.join(",")}))`,
        ].join(",")
      ),
  ]);

  if (pendingResult.error) {
    throw pendingResult.error;
  }

  if (acceptedResult.error) {
    throw acceptedResult.error;
  }

  return deriveLFGInviteStates({
    acceptedPairs: ((acceptedResult.data ?? []) as Array<Record<string, unknown>>)
      .filter(
        (row) =>
          typeof row.sender_profile_id === "string" &&
          typeof row.recipient_profile_id === "string"
      )
      .map((row) => ({
        recipientProfileId: row.recipient_profile_id as string,
        senderProfileId: row.sender_profile_id as string,
      })),
    currentProfileId: input.currentProfileId,
    pendingInvites: ((pendingResult.data ?? []) as Array<Record<string, unknown>>)
      .filter(
        (row) =>
          typeof row.recipient_profile_id === "string" &&
          typeof row.source_lfg_post_id === "string"
      )
      .map((row) => ({
        recipientProfileId: row.recipient_profile_id as string,
        sourceLFGPostId: row.source_lfg_post_id as string,
      })),
    posts: input.posts,
  });
}
