"use server";

import { createClient } from "@/lib/supabase/server";

export type UpdateLastSeenResult =
  | { status: "success" }
  | { status: "unauthenticated" }
  | { status: "error"; message: string };

export async function updateLastSeen(): Promise<UpdateLastSeenResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { status: "unauthenticated" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      last_seen_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    console.error("Last seen update failed", {
      error,
      profileId: user.id,
    });
    return {
      status: "error",
      message: "Unable to update presence activity right now.",
    };
  }

  return { status: "success" };
}
