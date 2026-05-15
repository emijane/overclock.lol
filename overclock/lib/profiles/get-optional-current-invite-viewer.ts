import { createClient } from "@/lib/supabase/server";
import { getOptionalAuthSubject } from "@/lib/supabase/auth-identity";
import type { InviteViewerState } from "@/lib/matches/play-invite-types";

type OptionalCurrentInviteViewer = {
  currentUserId: string | null;
  profileId: string | null;
  viewerState: InviteViewerState;
};

export async function getOptionalCurrentInviteViewer(): Promise<OptionalCurrentInviteViewer> {
  const subject = await getOptionalAuthSubject();

  if (!subject) {
    return {
      currentUserId: null,
      profileId: null,
      viewerState: "guest",
    };
  }

  const supabase = await createClient();
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
