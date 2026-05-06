import { createClient } from "@/lib/supabase/server";
import { formatCurrentRank } from "@/lib/profiles/profile-editor";

export type PlayInviteStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "expired"
  | "cancelled";

type SendPlayInviteResult = {
  created: boolean;
  errorCode: string | null;
  inviteId: string | null;
};

type UpdatePlayInviteResult = {
  errorCode: string | null;
  inviteId: string | null;
  status: PlayInviteStatus | null;
  updated: boolean;
};

type ExpirePlayInvitesResult = {
  errorCode: string | null;
  expiredCount: number;
};

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

export type ProfileInviteState =
  | "invite_to_play"
  | "invite_sent"
  | "matched";

function isPlayInviteStatus(value: unknown): value is PlayInviteStatus {
  return (
    value === "pending" ||
    value === "accepted" ||
    value === "declined" ||
    value === "expired" ||
    value === "cancelled"
  );
}

function normalizeSendPlayInviteResult(value: unknown): SendPlayInviteResult {
  if (typeof value === "string") {
    try {
      return normalizeSendPlayInviteResult(JSON.parse(value));
    } catch {
      return {
        created: false,
        errorCode: "invalid_response",
        inviteId: null,
      };
    }
  }

  if (Array.isArray(value)) {
    return value.length > 0
      ? normalizeSendPlayInviteResult(value[0])
      : {
          created: false,
          errorCode: "invalid_response",
          inviteId: null,
        };
  }

  if (!value || typeof value !== "object") {
    return {
      created: false,
      errorCode: "invalid_response",
      inviteId: null,
    };
  }

  const candidate = value as Record<string, unknown>;
  const nestedCandidate =
    candidate.send_play_invite &&
    typeof candidate.send_play_invite === "object" &&
    !Array.isArray(candidate.send_play_invite)
      ? (candidate.send_play_invite as Record<string, unknown>)
      : candidate;

  return {
    created: nestedCandidate.created === true,
    errorCode:
      typeof nestedCandidate.error_code === "string"
        ? nestedCandidate.error_code
        : null,
    inviteId:
      typeof nestedCandidate.invite_id === "string"
        ? nestedCandidate.invite_id
        : null,
  };
}

function normalizeUpdatePlayInviteResult(
  value: unknown,
  functionName:
    | "accept_play_invite"
    | "decline_play_invite"
    | "cancel_play_invite"
): UpdatePlayInviteResult {
  if (typeof value === "string") {
    try {
      return normalizeUpdatePlayInviteResult(JSON.parse(value), functionName);
    } catch {
      return {
        errorCode: "invalid_response",
        inviteId: null,
        status: null,
        updated: false,
      };
    }
  }

  if (Array.isArray(value)) {
    return value.length > 0
      ? normalizeUpdatePlayInviteResult(value[0], functionName)
      : {
          errorCode: "invalid_response",
          inviteId: null,
          status: null,
          updated: false,
        };
  }

  if (!value || typeof value !== "object") {
    return {
      errorCode: "invalid_response",
      inviteId: null,
      status: null,
      updated: false,
    };
  }

  const candidate = value as Record<string, unknown>;
  const nestedCandidate =
    candidate[functionName] &&
    typeof candidate[functionName] === "object" &&
    !Array.isArray(candidate[functionName])
      ? (candidate[functionName] as Record<string, unknown>)
      : candidate;

  return {
    errorCode:
      typeof nestedCandidate.error_code === "string"
        ? nestedCandidate.error_code
        : null,
    inviteId:
      typeof nestedCandidate.invite_id === "string"
        ? nestedCandidate.invite_id
        : null,
    status: isPlayInviteStatus(nestedCandidate.status)
      ? nestedCandidate.status
      : null,
    updated: nestedCandidate.updated === true,
  };
}

function normalizeExpirePlayInvitesResult(value: unknown): ExpirePlayInvitesResult {
  if (typeof value === "string") {
    try {
      return normalizeExpirePlayInvitesResult(JSON.parse(value));
    } catch {
      return {
        errorCode: "invalid_response",
        expiredCount: 0,
      };
    }
  }

  if (Array.isArray(value)) {
    return value.length > 0
      ? normalizeExpirePlayInvitesResult(value[0])
      : {
          errorCode: "invalid_response",
          expiredCount: 0,
        };
  }

  if (!value || typeof value !== "object") {
    return {
      errorCode: "invalid_response",
      expiredCount: 0,
    };
  }

  const candidate = value as Record<string, unknown>;
  const nestedCandidate =
    candidate.expire_play_invites &&
    typeof candidate.expire_play_invites === "object" &&
    !Array.isArray(candidate.expire_play_invites)
      ? (candidate.expire_play_invites as Record<string, unknown>)
      : candidate;

  return {
    errorCode:
      typeof nestedCandidate.error_code === "string"
        ? nestedCandidate.error_code
        : null,
    expiredCount:
      typeof nestedCandidate.expired_count === "number"
        ? nestedCandidate.expired_count
        : 0,
  };
}

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
  if (!input.currentProfileId || input.currentProfileId === input.targetProfileId) {
    return "invite_to_play";
  }

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

  if ((pendingResult.count ?? 0) > 0) {
    return "invite_sent";
  }

  if ((acceptedResult.count ?? 0) > 0) {
    return "matched";
  }

  return "invite_to_play";
}
