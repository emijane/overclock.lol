import { syncDiscordProfileFields } from "@/lib/profiles/sync-discord-profile-fields";
import { createClient } from "@/lib/supabase/server";

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
    .select(
      "id, username, display_name, discord_user_id, discord_username, discord_avatar_url, bio, timezone"
    )
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
