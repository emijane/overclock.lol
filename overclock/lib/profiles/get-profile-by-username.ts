import { createClient } from "@/lib/supabase/server";
import { hasEitherUserBlocked } from "@/lib/blocks/user-blocks";
import { PUBLIC_PROFILE_SELECT } from "@/lib/profiles/profile-selects";

// Loads a public profile by its unique app-owned username/handle.
export async function getProfileByUsername(
  username: string,
  viewerProfileId?: string | null
) {
  const normalizedUsername = username.trim().toLowerCase();
  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select(PUBLIC_PROFILE_SELECT)
    .eq("username", normalizedUsername)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (
    profile &&
    viewerProfileId &&
    (await hasEitherUserBlocked(viewerProfileId, profile.id))
  ) {
    return null;
  }

  return profile;
}
