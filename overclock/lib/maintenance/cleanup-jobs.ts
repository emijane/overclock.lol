import { createAdminClient } from "@/lib/supabase/admin";

type RpcResult = {
  deleted_count?: number | null;
  error_code?: string | null;
  expired_count?: number | null;
};

function normalizeRpcResult(value: unknown): RpcResult {
  if (typeof value === "string") {
    try {
      return normalizeRpcResult(JSON.parse(value));
    } catch {
      return { error_code: "invalid_response" };
    }
  }

  if (Array.isArray(value)) {
    return value.length > 0
      ? normalizeRpcResult(value[0])
      : { error_code: "invalid_response" };
  }

  if (!value || typeof value !== "object") {
    return { error_code: "invalid_response" };
  }

  return value as RpcResult;
}

export async function runLifecycleCleanupJobs() {
  const supabase = createAdminClient();
  const [playInviteResult, stackPostResult] = await Promise.all([
    supabase.rpc("expire_all_play_invites"),
    supabase.rpc("expire_stack_posts"),
  ]);

  if (playInviteResult.error) {
    throw playInviteResult.error;
  }

  if (stackPostResult.error) {
    throw stackPostResult.error;
  }

  const normalizedPlayInviteResult = normalizeRpcResult(playInviteResult.data);
  const normalizedStackPostResult = normalizeRpcResult(stackPostResult.data);

  if (
    normalizedPlayInviteResult.error_code ||
    normalizedStackPostResult.error_code
  ) {
    throw new Error("Cleanup lifecycle RPC returned an error response.");
  }

  return {
    playInvitesExpired: normalizedPlayInviteResult.expired_count ?? 0,
    stackPostsExpired: normalizedStackPostResult.expired_count ?? 0,
    ranAt: new Date().toISOString(),
  };
}

export async function runRetentionCleanupJobs() {
  const supabase = createAdminClient();
  const retentionCutoffIso = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  ).toISOString();
  const [userBlockEventsResult, profileMediaUploadsResult] = await Promise.all([
    supabase.rpc("cleanup_user_block_events", {
      p_before: retentionCutoffIso,
    }),
    supabase.rpc("cleanup_profile_media_uploads", {
      p_before: retentionCutoffIso,
    }),
  ]);

  if (userBlockEventsResult.error) {
    throw userBlockEventsResult.error;
  }

  if (profileMediaUploadsResult.error) {
    throw profileMediaUploadsResult.error;
  }

  const normalizedUserBlockEventsResult = normalizeRpcResult(
    userBlockEventsResult.data
  );
  const normalizedProfileMediaUploadsResult = normalizeRpcResult(
    profileMediaUploadsResult.data
  );

  if (
    normalizedUserBlockEventsResult.error_code ||
    normalizedProfileMediaUploadsResult.error_code
  ) {
    throw new Error("Cleanup retention RPC returned an error response.");
  }

  return {
    profileMediaUploadsDeleted:
      normalizedProfileMediaUploadsResult.deleted_count ?? 0,
    retentionCutoffIso,
    ranAt: new Date().toISOString(),
    userBlockEventsDeleted: normalizedUserBlockEventsResult.deleted_count ?? 0,
  };
}
