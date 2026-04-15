import { syncDiscordProfileFields } from "@/lib/profiles/sync-discord-profile-fields";
import { createClient } from "@/lib/supabase/server";
import { OWNER_PROFILE_SELECT } from "@/lib/profiles/profile-selects";

// Looks up the authenticated Supabase user and their matching app profile.
// This gives route-level code one place to answer "who is signed in?" and
// "have they finished onboarding yet?"
export async function getCurrentProfile() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { user: null, profile: null };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(OWNER_PROFILE_SELECT)
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  if (profile) {
    const syncedProfile = await syncDiscordProfileFields(user, profile);
    return { user, profile: syncedProfile };
  }

  return { user, profile };
}
