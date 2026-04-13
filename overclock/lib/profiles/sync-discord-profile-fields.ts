import type { User } from "@supabase/supabase-js";

import { getDiscordProfile } from "@/lib/profiles/discord-profile";
import { createClient } from "@/lib/supabase/server";

type ProfileRow = {
  bio: string | null;
  cover_image_path: string | null;
  cover_image_updated_at: string | null;
  current_rank_division: number | null;
  current_rank_tier: string | null;
  discord_avatar_url: string | null;
  discord_user_id: string | null;
  id: string;
  looking_for: string[] | null;
  platform: string | null;
  region: string | null;
  timezone: string | null;
  discord_username: string | null;
  username: string;
  display_name: string;
};

// Keeps stored Discord-facing profile fields aligned with trusted Supabase auth
// metadata for users who already have a profile row.
export async function syncDiscordProfileFields(user: User, profile: ProfileRow) {
  const discordProfile = getDiscordProfile(user);
  const nextDiscordUsername = discordProfile.discordUsername ?? null;
  const nextAvatarUrl = discordProfile.avatarUrl ?? null;

  const needsUpdate =
    profile.discord_username !== nextDiscordUsername ||
    profile.discord_avatar_url !== nextAvatarUrl;

  if (!needsUpdate) {
    return profile;
  }

  const supabase = await createClient();
  const { data: updatedProfile, error } = await supabase
    .from("profiles")
    .update({
      discord_username: nextDiscordUsername,
      discord_avatar_url: nextAvatarUrl,
    })
    .eq("id", profile.id)
    .select(
      "id, username, display_name, discord_user_id, discord_username, discord_avatar_url, cover_image_path, cover_image_updated_at, bio, timezone, region, platform, current_rank_tier, current_rank_division, looking_for"
    )
    .single();

  if (error) {
    throw error;
  }

  return updatedProfile;
}
