import type { User } from "@supabase/supabase-js";

import { getDiscordProfile } from "@/lib/profiles/discord-profile";
import { createClient } from "@/lib/supabase/server";

type ProfileRow = {
  avatar_updated_at: string | null;
  avatar_url: string | null;
  battlenet_handle: string | null;
  bio: string | null;
  cover_image_path: string | null;
  cover_image_updated_at: string | null;
  current_rank_division: number | null;
  current_rank_tier: string | null;
  discord_avatar_url: string | null;
  discord_user_id: string | null;
  discord_username: string | null;
  display_name: string;
  hide_offline_presence: boolean | null;
  id: string;
  is_looking_to_play: boolean | null;
  last_seen_at: string | null;
  looking_for: string[] | null;
  region: string | null;
  timezone: string | null;
  twitch_url: string | null;
  username: string;
  x_url: string | null;
  youtube_url: string | null;
};

// Keeps discord_username aligned with trusted Supabase auth metadata.
// We no longer sync discord_avatar_url — users upload their own avatar via /account.
export async function syncDiscordProfileFields(user: User, profile: ProfileRow) {
  const discordProfile = getDiscordProfile(user);
  const nextDiscordUsername = discordProfile.discordUsername ?? null;

  if (profile.discord_username === nextDiscordUsername) {
    return profile;
  }

  const supabase = await createClient();
  const { data: updatedProfile, error } = await supabase
    .from("profiles")
    .update({ discord_username: nextDiscordUsername })
    .eq("id", profile.id)
    .select(
      "id, username, display_name, discord_user_id, discord_username, discord_avatar_url, avatar_url, avatar_updated_at, cover_image_path, cover_image_updated_at, bio, timezone, region, current_rank_tier, current_rank_division, looking_for, battlenet_handle, twitch_url, x_url, youtube_url, last_seen_at, is_looking_to_play, hide_offline_presence"
    )
    .single();

  if (error) {
    throw error;
  }

  return updatedProfile;
}
