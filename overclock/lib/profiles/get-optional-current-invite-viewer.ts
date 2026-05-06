import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import type { InviteViewerState } from "@/lib/matches/play-invites";

function isSupabaseAuthCookie(cookieName: string) {
  return cookieName.startsWith("sb-") && cookieName.includes("auth-token");
}

type OptionalCurrentInviteViewer = {
  currentUserId: string | null;
  profileId: string | null;
  viewerState: InviteViewerState;
};

export async function getOptionalCurrentInviteViewer(): Promise<OptionalCurrentInviteViewer> {
  const cookieStore = await cookies();
  const hasAuthCookie = cookieStore.getAll().some((cookie) =>
    isSupabaseAuthCookie(cookie.name)
  );

  if (!hasAuthCookie) {
    return {
      currentUserId: null,
      profileId: null,
      viewerState: "guest",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const subject = data?.claims?.sub;

  if (error || typeof subject !== "string") {
    return {
      currentUserId: null,
      profileId: null,
      viewerState: "guest",
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", subject)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  return {
    currentUserId: subject,
    profileId: profile?.id ?? null,
    viewerState: profile ? "signed_in" : "profile_required",
  };
}
