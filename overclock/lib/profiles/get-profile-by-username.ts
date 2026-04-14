import { createClient } from "@/lib/supabase/server";

// Loads a public profile by its unique app-owned username/handle.
export async function getProfileByUsername(username: string) {
  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "id, username, display_name, discord_username, discord_avatar_url, cover_image_path, cover_image_updated_at, bio, timezone, region, platform, current_rank_tier, current_rank_division, looking_for, battlenet_handle, twitch_url, x_url, youtube_url"
    )
    .ilike("username", username)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return profile;
}
