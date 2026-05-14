"use server";

import { revalidatePath } from "next/cache";

import { getCurrentProfile } from "@/lib/profiles/get-current-profile";
import { getProfileAvatarUrl } from "@/lib/profiles/profile-media";
import { createClient } from "@/lib/supabase/server";

type UserBlockRpcResult = {
  actor_username?: string | null;
  created?: boolean;
  error_code?: string | null;
  removed?: boolean;
  target_username?: string | null;
};

type BlockedUserRow = {
  blocked_profile_id: string;
  created_at: string;
  blocked:
    | {
        avatar_updated_at: string | null;
        avatar_url: string | null;
        display_name: string | null;
        id: string;
        username: string | null;
      }
    | {
        avatar_updated_at: string | null;
        avatar_url: string | null;
        display_name: string | null;
        id: string;
        username: string | null;
      }[]
    | null;
};

export type BlockedUserListItem = {
  avatarUrl: string | null;
  blockedAt: string;
  displayName: string | null;
  profileId: string;
  username: string | null;
};

function normalizeUserBlockRpcResult(value: unknown): UserBlockRpcResult {
  if (typeof value === "string") {
    try {
      return normalizeUserBlockRpcResult(JSON.parse(value));
    } catch {
      return { error_code: "invalid_response" };
    }
  }

  if (Array.isArray(value)) {
    return value.length > 0
      ? normalizeUserBlockRpcResult(value[0])
      : { error_code: "invalid_response" };
  }

  if (!value || typeof value !== "object") {
    return { error_code: "invalid_response" };
  }

  const candidate = value as Record<string, unknown>;
  const nestedCandidate =
    typeof candidate.create_user_block === "object" &&
    candidate.create_user_block &&
    !Array.isArray(candidate.create_user_block)
      ? (candidate.create_user_block as Record<string, unknown>)
      : typeof candidate.delete_user_block === "object" &&
          candidate.delete_user_block &&
          !Array.isArray(candidate.delete_user_block)
        ? (candidate.delete_user_block as Record<string, unknown>)
        : candidate;

  return {
    actor_username:
      typeof nestedCandidate.actor_username === "string"
        ? nestedCandidate.actor_username
        : null,
    created: nestedCandidate.created === true,
    error_code:
      typeof nestedCandidate.error_code === "string"
        ? nestedCandidate.error_code
        : null,
    removed: nestedCandidate.removed === true,
    target_username:
      typeof nestedCandidate.target_username === "string"
        ? nestedCandidate.target_username
        : null,
  };
}

function revalidateBlockPaths(input: {
  currentUsername?: string | null;
  targetUsername?: string | null;
}) {
  revalidatePath("/account");
  revalidatePath("/duos");
  revalidatePath("/lfg");
  revalidatePath("/matches");
  revalidatePath("/search/users");
  revalidatePath("/stacks");

  if (input.currentUsername) {
    revalidatePath(`/u/${input.currentUsername}`);
  }

  if (input.targetUsername) {
    revalidatePath(`/u/${input.targetUsername}`);
  }
}

async function getCurrentUsernames(input: {
  currentProfileId: string;
  targetProfileId: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username")
    .in("id", [input.currentProfileId, input.targetProfileId]);

  if (error) {
    throw error;
  }

  const usernames = new Map<string, string | null>();

  for (const row of (data ?? []) as Array<Record<string, unknown>>) {
    if (typeof row.id !== "string") {
      continue;
    }

    usernames.set(row.id, typeof row.username === "string" ? row.username : null);
  }

  return usernames;
}

export async function blockUser(profileId: string) {
  const targetProfileId = profileId.trim();
  const { user, profile } = await getCurrentProfile();

  if (!user || !profile || !targetProfileId) {
    return {
      ok: false,
      message: "Action unavailable",
    } as const;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_user_block", {
    p_blocked_profile_id: targetProfileId,
  });

  if (error) {
    console.error("Block user RPC failed", {
      error,
      blockerProfileId: profile.id,
      blockedProfileId: targetProfileId,
    });

    return {
      ok: false,
      message: "Action unavailable",
    } as const;
  }

  const result = normalizeUserBlockRpcResult(data);

  if (result.error_code && result.error_code !== "duplicate_block") {
    return {
      ok: false,
      message: "Action unavailable",
    } as const;
  }

  revalidateBlockPaths({
    currentUsername: result.actor_username ?? profile.username,
    targetUsername: result.target_username,
  });

  return {
    ok: true,
    message: "User blocked",
  } as const;
}

export async function unblockUser(profileId: string) {
  const targetProfileId = profileId.trim();
  const { user, profile } = await getCurrentProfile();

  if (!user || !profile || !targetProfileId) {
    return {
      ok: false,
      message: "Action unavailable",
    } as const;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("delete_user_block", {
    p_blocked_profile_id: targetProfileId,
  });

  if (error) {
    console.error("Unblock user RPC failed", {
      error,
      blockerProfileId: profile.id,
      blockedProfileId: targetProfileId,
    });

    return {
      ok: false,
      message: "Action unavailable",
    } as const;
  }

  const result = normalizeUserBlockRpcResult(data);

  if (result.error_code) {
    return {
      ok: false,
      message: "Action unavailable",
    } as const;
  }

  const usernames = await getCurrentUsernames({
    currentProfileId: profile.id,
    targetProfileId,
  });

  revalidateBlockPaths({
    currentUsername: usernames.get(profile.id) ?? profile.username,
    targetUsername: usernames.get(targetProfileId),
  });

  return {
    ok: true,
    message: "User unblocked",
  } as const;
}

export async function getBlockedUsers(): Promise<BlockedUserListItem[]> {
  const { user, profile } = await getCurrentProfile();

  if (!user || !profile) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_blocks")
    .select(
      "blocked_profile_id, created_at, blocked:blocked_profile_id(id, username, display_name, avatar_url, avatar_updated_at)"
    )
    .eq("blocker_profile_id", profile.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as BlockedUserRow[]).map((row) => {
    const blockedProfile = Array.isArray(row.blocked) ? row.blocked[0] : row.blocked;

    return {
      avatarUrl: blockedProfile
        ? getProfileAvatarUrl(
            blockedProfile.avatar_url ?? null,
            blockedProfile.avatar_updated_at ?? null
          )
        : null,
      blockedAt: row.created_at,
      displayName: blockedProfile?.display_name ?? null,
      profileId: blockedProfile?.id ?? row.blocked_profile_id,
      username: blockedProfile?.username ?? null,
    } satisfies BlockedUserListItem;
  });
}

export async function isBlocked(viewerId: string | null, targetId: string | null) {
  if (!viewerId || !targetId) {
    return false;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("is_profile_blocked_by", {
    p_blocked_profile_id: targetId,
    p_blocker_profile_id: viewerId,
  });

  if (error) {
    throw error;
  }

  return data === true;
}

export async function hasEitherUserBlocked(
  userA: string | null,
  userB: string | null
) {
  if (!userA || !userB) {
    return false;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("has_either_user_blocked", {
    p_profile_a: userA,
    p_profile_b: userB,
  });

  if (error) {
    throw error;
  }

  return data === true;
}

export async function getBlockedProfileIdsForViewer(viewerId: string | null) {
  if (!viewerId) {
    return [] as string[];
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_blocked_profile_ids_for_viewer", {
    p_viewer_profile_id: viewerId,
  });

  if (error) {
    throw error;
  }

  if (!Array.isArray(data)) {
    return [];
  }

  return data.filter((value): value is string => typeof value === "string");
}
