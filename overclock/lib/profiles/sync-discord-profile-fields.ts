import type { User } from "@supabase/supabase-js";

import { getDiscordProfile } from "@/lib/profiles/discord-profile";
import { createClient } from "@/lib/supabase/server";

type ProfileRow = {
  id: string;
  discord_avatar_url: string | null;
  discord_username: string | null;
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
    .select("id, discord_user_id, username, display_name, discord_username, discord_avatar_url, bio, timezone")
    .single();

  if (error) {
    throw error;
  }

  return updatedProfile;
}
