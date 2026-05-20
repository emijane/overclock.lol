"use server";

import { createClient } from "@/lib/supabase/server";

export type UpdateLastSeenResult =
  | { status: "success" }
  | { status: "unauthenticated" }
  | { status: "error"; message: string };

type UpdateLastSeenRpcResult = {
  error_code?: string | null;
  updated?: boolean;
};

function normalizeUpdateLastSeenRpcResult(value: unknown): UpdateLastSeenRpcResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { error_code: "invalid_response", updated: false };
  }

  const candidate = value as Record<string, unknown>;
  const nestedCandidate =
    typeof candidate.update_last_seen === "object" &&
    candidate.update_last_seen &&
    !Array.isArray(candidate.update_last_seen)
      ? (candidate.update_last_seen as Record<string, unknown>)
      : candidate;

  return {
    error_code:
      typeof nestedCandidate.error_code === "string"
        ? nestedCandidate.error_code
        : null,
    updated: nestedCandidate.updated === true,
  };
}

export async function updateLastSeen(): Promise<UpdateLastSeenResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("update_last_seen");

  if (error) {
    console.error("Last seen update failed", {
      error,
    });
    return {
      status: "error",
      message: "Unable to update presence activity right now.",
    };
  }

  const result = normalizeUpdateLastSeenRpcResult(data);

  if (result.error_code === "unauthenticated") {
    return { status: "unauthenticated" };
  }

  if (!result.updated) {
    console.error("Last seen update returned unexpected result", {
      result,
    });
    return {
      status: "error",
      message: "Unable to update presence activity right now.",
    };
  }

  return { status: "success" };
}
